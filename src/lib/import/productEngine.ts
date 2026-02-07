import { supabase } from '@/integrations/supabase/client';
import { normText, normBool, normPriceToCents, normList, normDate, normInt, arraysEqual } from './normalize';
import type { PreviewRow, ImportReport, ImportStats, RowMessage } from './types';

/** Columns ignored during import (media) */
const IGNORED_COLS = ['images', 'cover_image', 'gallery_images', 'cover_video'];

/** Map Excel column names to DB field names */
const COL_MAP: Record<string, string> = {
  'Référence Produit': 'reference_code',
  'slug': 'slug',
  'status': 'status',
  'category_slug': 'category',
  'name_fr': 'name_fr',
  'name_en': 'name_en',
  'description_fr': 'description_fr',
  'description_en': 'description_en',
  'story_fr': 'story_fr',
  'story_en': 'story_en',
  'materials_fr': 'materials_fr',
  'materials_en': 'materials_en',
  'care_fr': 'care_fr',
  'care_en': 'care_en',
  'price_eur': '_price_eur',
  'price_usd': '_price_usd',
  'price_gbp': '_price_gbp',
  'price_cad': '_price_cad',
  'made_to_order': 'made_to_order',
  'min_days': 'made_to_order_min_days',
  'max_days': 'made_to_order_max_days',
  'made_to_measure': 'made_to_measure',
  'preorder': 'preorder',
  'preorder_ship_date_estimate': 'preorder_ship_date_estimate',
  'stock_qty': 'stock_qty',
  'sizes': 'sizes',
  'colors': 'colors',
  'materials_list': 'materials',
  'braiding_options': 'braiding_options',
};

function parseRow(raw: Record<string, any>) {
  const ref = normText(raw['Référence Produit']);
  const slug = normText(raw['slug']);
  const priceEur = normPriceToCents(raw['price_eur']);
  const priceUsd = normPriceToCents(raw['price_usd']);
  const priceGbp = normPriceToCents(raw['price_gbp']);
  const priceCad = normPriceToCents(raw['price_cad']);

  const overrides: Record<string, number> = {};
  if (priceUsd) overrides['USD'] = priceUsd;
  if (priceGbp) overrides['GBP'] = priceGbp;
  if (priceCad) overrides['CAD'] = priceCad;

  return {
    reference_code: ref,
    slug,
    status: normText(raw['status']) || 'draft',
    category: normText(raw['category_slug']),
    name_fr: normText(raw['name_fr']),
    name_en: normText(raw['name_en']),
    description_fr: normText(raw['description_fr']),
    description_en: normText(raw['description_en']),
    story_fr: normText(raw['story_fr']),
    story_en: normText(raw['story_en']),
    materials_fr: normText(raw['materials_fr']),
    materials_en: normText(raw['materials_en']),
    care_fr: normText(raw['care_fr']),
    care_en: normText(raw['care_en']),
    base_price_eur: priceEur,
    price_overrides: overrides,
    made_to_order: normBool(raw['made_to_order']),
    made_to_order_min_days: normInt(raw['min_days']),
    made_to_order_max_days: normInt(raw['max_days']),
    made_to_measure: normBool(raw['made_to_measure']),
    preorder: normBool(raw['preorder']),
    preorder_ship_date_estimate: normDate(raw['preorder_ship_date_estimate']),
    stock_qty: normInt(raw['stock_qty']),
    sizes: normList(raw['sizes']),
    colors: normList(raw['colors']),
    materials: normList(raw['materials_list']),
    braiding_options: normList(raw['braiding_options']),
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
  // Fetch existing products
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
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(raw['name_fr']), status: 'ERROR', messages: [{ severity: 'error', message: `Référence Produit invalide ou manquante: "${ref}" (format attendu: PRO001)` }], data: raw });
      stats.errors++;
      continue;
    }
    if (!slug) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(raw['name_fr']), status: 'ERROR', messages: [{ severity: 'error', message: 'Slug manquant' }], data: raw });
      stats.errors++;
      continue;
    }

    // Duplicate slug in file
    if (slugsInFile.has(slug)) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(raw['name_fr']), status: 'ERROR', messages: [{ severity: 'error', message: `Slug "${slug}" dupliqué dans le fichier (ligne ${slugsInFile.get(slug)})` }], data: raw });
      stats.errors++;
      continue;
    }
    slugsInFile.set(slug, i + 2);

    // Validate status
    const status = normText(raw['status']) || 'draft';
    if (!['active', 'draft'].includes(status)) {
      messages.push({ severity: 'error', message: `Status invalide: "${status}" (attendu: active/draft)` });
    }

    // Validate booleans + days
    const mto = normBool(raw['made_to_order']);
    if (mto) {
      const minD = normInt(raw['min_days']);
      const maxD = normInt(raw['max_days']);
      if (minD == null || maxD == null) {
        messages.push({ severity: 'error', message: 'made_to_order=true requiert min_days et max_days' });
      } else if (minD > maxD) {
        messages.push({ severity: 'error', message: `min_days (${minD}) > max_days (${maxD})` });
      }
    }

    if (messages.some(m => m.severity === 'error')) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(raw['name_fr']), status: 'ERROR', messages, data: raw });
      stats.errors++;
      continue;
    }

    const parsed = parseRow(raw);

    // Check slug collision with different reference
    const slugOwner = bySlug.get(slug);
    if (slugOwner && slugOwner.reference_code !== ref && byRef.has(ref) === false) {
      // Slug belongs to another product with different reference
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'ERROR', messages: [{ severity: 'error', message: `Slug "${slug}" déjà utilisé par un autre produit (ref: ${slugOwner.reference_code || 'N/A'})` }], data: raw });
      stats.errors++;
      continue;
    }

    const existingProduct = byRef.get(ref);
    if (existingProduct) {
      const changes = compareFields(parsed, existingProduct);
      if (changes.length === 0) {
        preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'NO_CHANGE', messages, data: raw });
        stats.no_change++;
      } else {
        preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'UPDATE', messages, data: raw, changes });
        stats.updated++;
      }
    } else {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'CREATE', messages, data: raw });
      stats.created++;
    }
  }

  return { rows: preview, stats };
}

export async function executeProductImport(previewRows: PreviewRow[]): Promise<void> {
  const { data: existing } = await supabase.from('products').select('id, reference_code');
  const byRef = new Map<string, string>();
  for (const p of existing || []) {
    if (p.reference_code) byRef.set(p.reference_code, p.id);
  }

  const toCreate = previewRows.filter(r => r.status === 'CREATE');
  const toUpdate = previewRows.filter(r => r.status === 'UPDATE');

  // Batch create
  if (toCreate.length > 0) {
    const inserts = toCreate.map(r => {
      const p = parseRow(r.data);
      return { ...p, images: [], };
    });
    const { error } = await supabase.from('products').insert(inserts);
    if (error) throw new Error(`Erreur insertion: ${error.message}`);
  }

  // Batch update (50 at a time)
  for (let i = 0; i < toUpdate.length; i += 50) {
    const batch = toUpdate.slice(i, i + 50);
    for (const r of batch) {
      const p = parseRow(r.data);
      const id = byRef.get(r.referenceCode);
      if (!id) continue;
      // Remove media fields & reference_code from update payload
      const { reference_code, ...updateData } = p;
      const { error } = await supabase.from('products').update(updateData).eq('id', id);
      if (error) throw new Error(`Erreur update ${r.referenceCode}: ${error.message}`);
    }
  }
}
