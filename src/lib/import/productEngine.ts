import { supabase } from '@/integrations/supabase/client';
import { normText, normBool, normPriceToCents, normList, normDate, normInt, arraysEqual } from './normalize';
import type { PreviewRow, ImportReport, ImportStats, RowMessage } from './types';

/**
 * Resolve a column value from a raw row, trying multiple possible header names.
 * Excel headers may use "min_days" or "made_to_order_min_days", etc.
 */
function col(raw: Record<string, any>, ...keys: string[]): any {
  for (const k of keys) {
    if (k in raw && raw[k] !== '' && raw[k] != null) return raw[k];
  }
  // Also try case-insensitive
  const lowerMap = new Map(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
  for (const k of keys) {
    const v = lowerMap.get(k.toLowerCase());
    if (v !== '' && v != null) return v;
  }
  return undefined;
}

function parseRow(raw: Record<string, any>) {
  const ref = normText(raw['Référence Produit']);
  const slug = normText(raw['slug']);
  const priceEur = normPriceToCents(col(raw, 'price_eur'));
  const priceUsd = normPriceToCents(col(raw, 'price_usd'));
  const priceGbp = normPriceToCents(col(raw, 'price_gbp'));
  const priceCad = normPriceToCents(col(raw, 'price_cad'));

  const overrides: Record<string, number> = {};
  if (priceUsd) overrides['USD'] = priceUsd;
  if (priceGbp) overrides['GBP'] = priceGbp;
  if (priceCad) overrides['CAD'] = priceCad;

  return {
    reference_code: ref,
    slug,
    status: normText(col(raw, 'status')) || 'draft',
    category: normText(col(raw, 'category_slug')),
    name_fr: normText(col(raw, 'name_fr')),
    name_en: normText(col(raw, 'name_en')),
    description_fr: normText(col(raw, 'description_fr')),
    description_en: normText(col(raw, 'description_en')),
    story_fr: normText(col(raw, 'story_fr')),
    story_en: normText(col(raw, 'story_en')),
    materials_fr: normText(col(raw, 'materials_fr')),
    materials_en: normText(col(raw, 'materials_en')),
    care_fr: normText(col(raw, 'care_fr')),
    care_en: normText(col(raw, 'care_en')),
    base_price_eur: priceEur,
    price_overrides: overrides,
    made_to_order: normBool(col(raw, 'made_to_order')),
    made_to_order_min_days: normInt(col(raw, 'made_to_order_min_days', 'min_days')),
    made_to_order_max_days: normInt(col(raw, 'made_to_order_max_days', 'max_days')),
    made_to_measure: normBool(col(raw, 'made_to_measure')),
    preorder: normBool(col(raw, 'preorder')),
    preorder_ship_date_estimate: normDate(col(raw, 'preorder_ship_date_estimate')),
    stock_qty: normInt(col(raw, 'stock_qty')),
    sizes: normList(col(raw, 'sizes')),
    colors: normList(col(raw, 'colors')),
    materials: normList(col(raw, 'materials_list')),
    braiding_options: normList(col(raw, 'braiding_options')),
  };
}

function compareFields(parsed: any, existing: any): string[] {
  const changes: string[] = [];
  const textFields = [
    'slug', 'status', 'category', 'name_fr', 'name_en',
    'description_fr', 'description_en', 'story_fr', 'story_en',
    'materials_fr', 'materials_en', 'care_fr', 'care_en',
  ];
  for (const f of textFields) {
    if (normText(parsed[f]) !== normText(existing[f] ?? '')) changes.push(f);
  }
  if (parsed.base_price_eur !== (existing.base_price_eur ?? 0)) changes.push('base_price_eur');

  const existOverrides = existing.price_overrides ?? {};
  if (JSON.stringify(parsed.price_overrides) !== JSON.stringify(existOverrides)) changes.push('price_overrides');

  const boolFields = ['made_to_order', 'made_to_measure', 'preorder'];
  for (const f of boolFields) {
    if (parsed[f] !== !!(existing[f])) changes.push(f);
  }

  const intFields = ['made_to_order_min_days', 'made_to_order_max_days', 'stock_qty'];
  for (const f of intFields) {
    if (parsed[f] !== (existing[f] ?? null)) changes.push(f);
  }

  if (normText(parsed.preorder_ship_date_estimate ?? '') !== normText(existing.preorder_ship_date_estimate ?? '')) {
    changes.push('preorder_ship_date_estimate');
  }

  const listFields = ['sizes', 'colors', 'materials', 'braiding_options'];
  for (const f of listFields) {
    const a = [...(parsed[f] || [])].sort();
    const b = [...(existing[f] || [])].sort();
    if (!arraysEqual(a, b)) changes.push(f);
  }

  return changes;
}

export async function previewProductImport(rows: Record<string, any>[]): Promise<ImportReport> {
  const { data: existing } = await supabase.from('products').select('*');
  const byRef = new Map<string, any>();
  const bySlug = new Map<string, any>();
  for (const p of existing || []) {
    if (p.reference_code) byRef.set(p.reference_code, p);
    bySlug.set(p.slug, p);
  }

  const preview: PreviewRow[] = [];
  const slugsInFile = new Map<string, number>();
  const stats: ImportStats = { created: 0, updated: 0, no_change: 0, errors: 0, warnings: 0 };

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const messages: RowMessage[] = [];
    const ref = normText(raw['Référence Produit']);
    const slug = normText(raw['slug']);

    // Validate reference_code
    if (!ref || !/^PRO\d{3,}$/.test(ref)) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'name_fr')), status: 'ERROR', messages: [{ severity: 'error', message: `Référence Produit invalide ou manquante: "${ref}" (format attendu: PRO001)` }], data: raw });
      stats.errors++;
      continue;
    }
    if (!slug) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'name_fr')), status: 'ERROR', messages: [{ severity: 'error', message: 'Slug manquant' }], data: raw });
      stats.errors++;
      continue;
    }

    // Duplicate slug in file
    if (slugsInFile.has(slug)) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'name_fr')), status: 'ERROR', messages: [{ severity: 'error', message: `Slug "${slug}" dupliqué dans le fichier (ligne ${slugsInFile.get(slug)})` }], data: raw });
      stats.errors++;
      continue;
    }
    slugsInFile.set(slug, i + 2);

    // Validate status
    const status = normText(col(raw, 'status')) || 'draft';
    if (!['active', 'draft'].includes(status)) {
      messages.push({ severity: 'error', message: `Status invalide: "${status}" (attendu: active/draft)` });
    }

    // Validate booleans + days with robust parsing
    const mto = normBool(col(raw, 'made_to_order'));
    const minD = normInt(col(raw, 'made_to_order_min_days', 'min_days'));
    const maxD = normInt(col(raw, 'made_to_order_max_days', 'max_days'));

    if (mto) {
      if (minD === null || maxD === null) {
        messages.push({ severity: 'error', message: `Sur commande : renseignez min et max (en jours) dans les colonnes made_to_order_min_days et made_to_order_max_days. (parsé: min=${minD}, max=${maxD})` });
      } else if (minD < 1 || maxD < 1) {
        messages.push({ severity: 'error', message: `Sur commande : min et max doivent être ≥ 1. (parsé: min=${minD}, max=${maxD})` });
      } else if (minD > maxD) {
        messages.push({ severity: 'error', message: `Sur commande : min (${minD}) > max (${maxD})` });
      }
    }

    // Add debug info for made_to_order fields
    messages.push({ severity: 'warning', message: `[debug] made_to_order=${mto}, min_days=${minD}, max_days=${maxD}` });

    const hasBlockingError = messages.some(m => m.severity === 'error');

    if (hasBlockingError) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'name_fr')), status: 'ERROR', messages, data: raw });
      stats.errors++;
      continue;
    }

    // Remove debug messages from final non-error rows (keep them only for errors to debug)
    const cleanMessages = messages.filter(m => !m.message.startsWith('[debug]'));

    const parsed = parseRow(raw);

    // --- Matching algorithm: reference_code first, then slug ---
    let candidate: any = byRef.get(ref);

    if (!candidate) {
      const slugOwner = bySlug.get(slug);
      if (slugOwner) {
        if (!slugOwner.reference_code) {
          // Existing product without reference_code -> adopt it
          candidate = slugOwner;
          cleanMessages.push({ severity: 'warning', message: `Référence ${ref} attribuée au produit existant (slug: ${slug})` });
          stats.warnings++;
        } else if (slugOwner.reference_code === ref) {
          candidate = slugOwner;
        } else {
          // Real conflict: slug used by another product with a different reference_code
          preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'ERROR', messages: [{ severity: 'error', message: `Slug "${slug}" déjà utilisé par un autre produit (ref: ${slugOwner.reference_code})` }], data: raw });
          stats.errors++;
          continue;
        }
      }
    }

    if (candidate) {
      const changes = compareFields(parsed, candidate);
      // If reference_code was empty, the assignment itself counts as a change
      if (!candidate.reference_code) {
        if (!changes.includes('reference_code')) changes.push('reference_code');
      }
      if (changes.length === 0) {
        preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'NO_CHANGE', messages: cleanMessages, data: { ...raw, _candidateId: candidate.id } });
        stats.no_change++;
      } else {
        preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'UPDATE', messages: cleanMessages, data: { ...raw, _candidateId: candidate.id }, changes });
        stats.updated++;
      }
    } else {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'CREATE', messages: cleanMessages, data: raw });
      stats.created++;
    }
  }

  return { rows: preview, stats };
}

export async function executeProductImport(previewRows: PreviewRow[]): Promise<void> {
  const toCreate = previewRows.filter(r => r.status === 'CREATE');
  const toUpdate = previewRows.filter(r => r.status === 'UPDATE');

  if (toCreate.length > 0) {
    const inserts = toCreate.map(r => {
      const p = parseRow(r.data);
      return { ...p, images: [] };
    });
    const { error } = await supabase.from('products').insert(inserts);
    if (error) throw new Error(`Erreur insertion: ${error.message}`);
  }

  for (let i = 0; i < toUpdate.length; i += 50) {
    const batch = toUpdate.slice(i, i + 50);
    for (const r of batch) {
      const p = parseRow(r.data);
      const id = r.data._candidateId;
      if (!id) continue;
      // Include reference_code in update (handles migration of empty reference_code)
      const { error } = await supabase.from('products').update(p).eq('id', id);
      if (error) throw new Error(`Erreur update ${r.referenceCode}: ${error.message}`);
    }
  }
}
