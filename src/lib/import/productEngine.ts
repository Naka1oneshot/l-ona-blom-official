import { supabase } from '@/integrations/supabase/client';
import { normText, normBool, normPriceToCents, normList, normDate, normInt, arraysEqual, colFuzzy } from './normalize';
import { parseEditorialBlocks, normalizeEditorialBlocksForDiff } from './editorialParser';
import { normalizeSizesFromSet, STANDARD_SIZES } from '@/lib/pricing';
import type { PreviewRow, ImportReport, ImportStats, RowMessage } from './types';

/* ── column resolver shortcut ── */
function col(raw: Record<string, any>, ...aliases: string[]): any {
  return colFuzzy(raw, ...aliases);
}

/* ── Status FR -> DB ── */
function mapStatus(raw: string): string | null {
  const s = normText(raw).toLowerCase();
  if (['actif', 'active'].includes(s)) return 'active';
  if (['brouillon', 'draft'].includes(s)) return 'draft';
  return null;
}

/* ── Category resolution types ── */
interface CategoryInfo { id: string; slug: string; name_fr: string }

async function loadCategories() {
  const { data } = await supabase.from('categories').select('id, slug, name_fr');
  const bySlug = new Map<string, CategoryInfo>();
  const byNameNorm = new Map<string, CategoryInfo>();
  for (const c of data || []) {
    bySlug.set(c.slug, c);
    const norm = c.name_fr.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    byNameNorm.set(norm, c);
  }
  return { bySlug, byNameNorm };
}

function resolveCategory(
  raw: string,
  bySlug: Map<string, CategoryInfo>,
  byNameNorm: Map<string, CategoryInfo>
): CategoryInfo | null {
  const v = normText(raw);
  if (!v) return null;
  if (bySlug.has(v)) return bySlug.get(v)!;
  const norm = v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (byNameNorm.has(norm)) return byNameNorm.get(norm)!;
  return null;
}

/* ── Translate helper ── */
async function translateTexts(texts: Record<string, string>): Promise<Record<string, string>> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(texts)) {
    if (v && v.trim()) filtered[k] = v;
  }
  if (Object.keys(filtered).length === 0) return {};

  try {
    const { data, error } = await supabase.functions.invoke('translate', {
      body: { texts: filtered },
    });
    if (error) throw error;
    return data?.translations || {};
  } catch (e) {
    console.error('Translation failed:', e);
    return {};
  }
}

/* ── Translate editorial blocks ── */
async function translateEditorialBlocks(blocks: any[]): Promise<any[]> {
  if (!blocks || blocks.length === 0) return [];

  const texts: Record<string, string> = {};
  blocks.forEach((b, i) => {
    if (b.title_fr) texts[`block${i}_title_fr`] = b.title_fr;
    if (b.body_fr) texts[`block${i}_body_fr`] = b.body_fr;
  });

  if (Object.keys(texts).length === 0) return blocks;

  const translations = await translateTexts(texts);

  return blocks.map((b, i) => ({
    ...b,
    title_en: translations[`block${i}_title_en`] || b.title_fr,
    body_en: translations[`block${i}_body_en`] || b.body_fr,
  }));
}

/* ── Parse size_set and build price_by_size_eur ── */
function parseSizePricing(raw: Record<string, any>): {
  sizes: string[];
  price_by_size_eur: Record<string, number>;
  base_price_eur: number;
} {
  const sizeSetRaw = normText(col(raw, 'Grille de tailles', 'size_set', 'Tailles'));
  const fallbackPrice = normPriceToCents(col(raw, 'Prix (EUR)', 'Prix EUR', 'price_eur'));

  // Read individual size prices
  const priceTU = normPriceToCents(col(raw, 'Prix TU (EUR)', 'Prix TU EUR', 'price_tu_eur'));
  const priceXS = normPriceToCents(col(raw, 'Prix XS (EUR)', 'Prix XS EUR', 'price_xs_eur'));
  const priceS = normPriceToCents(col(raw, 'Prix S (EUR)', 'Prix S EUR', 'price_s_eur'));
  const priceM = normPriceToCents(col(raw, 'Prix M (EUR)', 'Prix M EUR', 'price_m_eur'));
  const priceL = normPriceToCents(col(raw, 'Prix L (EUR)', 'Prix L EUR', 'price_l_eur'));
  const priceXL = normPriceToCents(col(raw, 'Prix XL (EUR)', 'Prix XL EUR', 'price_xl_eur'));
  const price2XL = normPriceToCents(col(raw, 'Prix 2XL (EUR)', 'Prix 2XL EUR', 'price_2xl_eur'));
  const price3XL = normPriceToCents(col(raw, 'Prix 3XL (EUR)', 'Prix 3XL EUR', 'price_3xl_eur'));

  const sizePriceMap: Record<string, number> = {
    TU: priceTU, XS: priceXS, S: priceS, M: priceM, L: priceL, XL: priceXL, '2XL': price2XL, '3XL': price3XL,
  };

  // Determine size set
  let sizeSet: 'TU' | 'standard' = 'standard';
  const upper = sizeSetRaw.toUpperCase().trim();
  if (upper === 'TU' || upper === 'TAILLE UNIQUE') {
    sizeSet = 'TU';
  } else if (!sizeSetRaw) {
    // Auto-detect: if TU price set and no standard prices, assume TU
    if (priceTU > 0 && priceXS === 0 && priceS === 0 && priceM === 0 && priceL === 0) {
      sizeSet = 'TU';
    }
  }

  const sizes = sizeSet === 'TU' ? ['TU'] : [...STANDARD_SIZES];
  const price_by_size_eur: Record<string, number> = {};

  for (const s of sizes) {
    const specific = sizePriceMap[s] || 0;
    price_by_size_eur[s] = specific > 0 ? specific : fallbackPrice;
  }

  const values = Object.values(price_by_size_eur).filter(v => v > 0);
  const base_price_eur = values.length > 0 ? Math.min(...values) : fallbackPrice;

  return { sizes, price_by_size_eur, base_price_eur };
}

/* ── Parse a single row ── */
function parseRow(
  raw: Record<string, any>,
  catInfo: CategoryInfo | null
) {
  const editorialRaw = col(raw, 'Encarts narratifs (FR - Scrollytelling)', 'editorial_blocks_fr');
  const editorialBlocks = parseEditorialBlocks(editorialRaw);
  const { sizes, price_by_size_eur, base_price_eur } = parseSizePricing(raw);

  return {
    reference_code: normText(col(raw, 'Référence Produit', 'reference_code')),
    slug: normText(col(raw, 'Slug', 'slug')),
    status: mapStatus(col(raw, 'Statut', 'status') || '') || 'draft',
    category: catInfo?.slug || normText(col(raw, 'Catégorie', 'category_slug', 'category')),
    category_id: catInfo?.id || null,
    name_fr: normText(col(raw, 'Nom (FR)', 'Nom FR', 'name_fr')),
    description_fr: normText(col(raw, 'Description (FR)', 'Description FR', 'description_fr')),
    story_fr: normText(col(raw, 'Histoire (FR)', 'Histoire FR', 'story_fr')),
    materials_fr: normText(col(raw, 'Matières (FR - texte)', 'Matières FR texte', 'Matieres FR', 'materials_fr')),
    care_fr: normText(col(raw, 'Entretien (FR)', 'Entretien FR', 'care_fr')),
    base_price_eur,
    price_by_size_eur,
    sizes,
    price_overrides: {},
    made_to_order: normBool(col(raw, 'Sur commande', 'made_to_order')),
    made_to_order_min_days: normInt(col(raw, 'Délai min (jours)', 'Délai min jours', 'made_to_order_min_days', 'min_days')),
    made_to_order_max_days: normInt(col(raw, 'Délai max (jours)', 'Délai max jours', 'made_to_order_max_days', 'max_days')),
    made_to_measure: normBool(col(raw, 'Sur mesure', 'made_to_measure')),
    preorder: normBool(col(raw, 'Précommande', 'preorder')),
    preorder_ship_date_estimate: normDate(col(raw, 'Date expédition estimée (YYYY-MM-DD)', 'Date expédition estimee', 'preorder_ship_date_estimate')),
    stock_qty: normInt(col(raw, 'Stock (quantité)', 'Stock quantite', 'stock_qty')),
    colors: normList(col(raw, 'Couleurs (séparées par |)', 'Couleurs separees par', 'colors')),
    materials: normList(col(raw, 'Matières - tags (séparées par |)', 'Matieres tags separees par', 'materials_list', 'materials')),
    braiding_options: normList(col(raw, 'Tressages (séparées par |)', 'Tressages separees par', 'braiding_options')),
    braiding_colors: normList(col(raw, 'Couleurs de tressage (séparées par |)', 'Couleurs de tressage separees par', 'braiding_colors')),
    _editorial_blocks_fr: editorialBlocks,
  };
}

/* ── Compare price_by_size_eur ── */
function comparePriceBySizeEur(a: Record<string, number>, b: Record<string, number>): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k, i) => k === keysB[i] && a[k] === b[k]);
}

/* ── Compare (FR-only, no EN comparison) ── */
function compareFields(parsed: any, existing: any): string[] {
  const changes: string[] = [];
  const textFields = [
    'slug', 'status', 'category',
    'name_fr', 'description_fr', 'story_fr', 'materials_fr', 'care_fr',
  ];
  for (const f of textFields) {
    if (normText(parsed[f]) !== normText(existing[f] ?? '')) changes.push(f);
  }
  // category_id
  if (parsed.category_id && parsed.category_id !== (existing.category_id ?? null)) {
    if (!changes.includes('category')) changes.push('category_id');
  }

  if (parsed.base_price_eur !== (existing.base_price_eur ?? 0)) changes.push('base_price_eur');

  // price_by_size_eur
  const existingPBS = (existing.price_by_size_eur as Record<string, number>) || {};
  if (!comparePriceBySizeEur(parsed.price_by_size_eur || {}, existingPBS)) {
    changes.push('price_by_size_eur');
  }

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

  const listFields = ['sizes', 'colors', 'materials', 'braiding_options', 'braiding_colors'];
  for (const f of listFields) {
    const a = [...(parsed[f] || [])].sort();
    const b = [...(existing[f] || [])].sort();
    if (!arraysEqual(a, b)) changes.push(f);
  }

  // Compare editorial blocks only if import provides them
  if (parsed._editorial_blocks_fr != null) {
    const parsedNorm = normalizeEditorialBlocksForDiff(parsed._editorial_blocks_fr);
    const existNorm = normalizeEditorialBlocksForDiff(existing.editorial_blocks_json);
    if (parsedNorm !== existNorm) changes.push('editorial_blocks_json');
  }

  return changes;
}

/* ═══════════ PREVIEW ═══════════ */
export async function previewProductImport(rows: Record<string, any>[]): Promise<ImportReport> {
  const [{ data: existing }, categories] = await Promise.all([
    supabase.from('products').select('*'),
    loadCategories(),
  ]);

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
    const ref = normText(col(raw, 'Référence Produit', 'reference_code'));
    const slug = normText(col(raw, 'Slug', 'slug'));

    if (!ref || !/^PRO\d{3,}$/.test(ref)) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'Nom (FR)', 'Nom FR', 'name_fr')), status: 'ERROR', messages: [{ severity: 'error', message: `Référence Produit invalide: "${ref}" (format: PRO001)` }], data: raw });
      stats.errors++;
      continue;
    }
    if (!slug) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'Nom (FR)', 'Nom FR', 'name_fr')), status: 'ERROR', messages: [{ severity: 'error', message: 'Slug manquant' }], data: raw });
      stats.errors++;
      continue;
    }
    if (slugsInFile.has(slug)) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'Nom (FR)', 'Nom FR', 'name_fr')), status: 'ERROR', messages: [{ severity: 'error', message: `Slug "${slug}" dupliqué (ligne ${slugsInFile.get(slug)})` }], data: raw });
      stats.errors++;
      continue;
    }
    slugsInFile.set(slug, i + 2);

    // Resolve category
    const catRaw = normText(col(raw, 'Catégorie', 'category_slug', 'category'));
    let catInfo: CategoryInfo | null = null;
    if (catRaw) {
      catInfo = resolveCategory(catRaw, categories.bySlug, categories.byNameNorm);
      if (!catInfo) {
        messages.push({ severity: 'error', message: `Catégorie inconnue: "${catRaw}"` });
      }
    }

    // Validate status
    const statusRaw = col(raw, 'Statut', 'status') || '';
    const status = mapStatus(statusRaw);
    if (statusRaw && !status) {
      messages.push({ severity: 'error', message: `Statut invalide: "${statusRaw}" (attendu: Actif/Brouillon)` });
    }

    // Validate pricing: at least one price must be set
    const { base_price_eur: parsedPrice } = parseSizePricing(raw);
    if (parsedPrice <= 0) {
      messages.push({ severity: 'error', message: 'Aucun prix renseigné (Prix EUR ou prix par taille requis)' });
    }

    // Validate made_to_order days
    const mto = normBool(col(raw, 'Sur commande', 'made_to_order'));
    const minD = normInt(col(raw, 'Délai min (jours)', 'Délai min jours', 'made_to_order_min_days', 'min_days'));
    const maxD = normInt(col(raw, 'Délai max (jours)', 'Délai max jours', 'made_to_order_max_days', 'max_days'));
    if (mto) {
      if (minD === null || maxD === null) {
        messages.push({ severity: 'error', message: 'Sur commande : délai min et max requis' });
      } else if (minD < 1 || maxD < 1) {
        messages.push({ severity: 'error', message: `Délais doivent être ≥ 1 (min=${minD}, max=${maxD})` });
      } else if (minD > maxD) {
        messages.push({ severity: 'error', message: `Délai min (${minD}) > max (${maxD})` });
      }
    }

    const hasBlockingError = messages.some(m => m.severity === 'error');
    if (hasBlockingError) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'Nom (FR)', 'Nom FR', 'name_fr')), status: 'ERROR', messages, data: raw });
      stats.errors++;
      continue;
    }

    const parsed = parseRow(raw, catInfo);

    // Matching: ref first, then slug
    let candidate: any = byRef.get(ref);
    if (!candidate) {
      const slugOwner = bySlug.get(slug);
      if (slugOwner) {
        if (!slugOwner.reference_code) {
          candidate = slugOwner;
          messages.push({ severity: 'warning', message: `Référence ${ref} attribuée au produit existant (slug: ${slug})` });
          stats.warnings++;
        } else if (slugOwner.reference_code === ref) {
          candidate = slugOwner;
        } else {
          preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'ERROR', messages: [{ severity: 'error', message: `Slug "${slug}" utilisé par un autre produit (ref: ${slugOwner.reference_code})` }], data: raw });
          stats.errors++;
          continue;
        }
      }
    }

    if (candidate) {
      const changes = compareFields(parsed, candidate);
      if (!candidate.reference_code && !changes.includes('reference_code')) changes.push('reference_code');
      if (changes.length === 0) {
        preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'NO_CHANGE', messages, data: { ...raw, _candidateId: candidate.id, _catInfo: catInfo } });
        stats.no_change++;
      } else {
        preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'UPDATE', messages, data: { ...raw, _candidateId: candidate.id, _catInfo: catInfo }, changes });
        stats.updated++;
      }
    } else {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.name_fr, status: 'CREATE', messages, data: { ...raw, _catInfo: catInfo } });
      stats.created++;
    }
  }

  return { rows: preview, stats };
}

/* ═══════════ EXECUTE ═══════════ */
export async function executeProductImport(
  previewRows: PreviewRow[],
  onProgress?: (current: number, total: number, label: string) => void
): Promise<RowMessage[]> {
  const toProcess = previewRows.filter(r => r.status === 'CREATE' || r.status === 'UPDATE');
  const warnings: RowMessage[] = [];
  const total = toProcess.length;

  // Reload categories for execution
  const categories = await loadCategories();

  for (let idx = 0; idx < toProcess.length; idx++) {
    const r = toProcess[idx];
    onProgress?.(idx + 1, total, r.label || r.slug);

    const catInfo = r.data._catInfo as CategoryInfo | null ??
      resolveCategory(
        normText(col(r.data, 'Catégorie', 'category_slug', 'category')),
        categories.bySlug,
        categories.byNameNorm
      );

    const parsed = parseRow(r.data, catInfo);
    const { _editorial_blocks_fr, ...fields } = parsed;

    // Auto-translate FR -> EN
    const textsToTranslate: Record<string, string> = {};
    if (fields.name_fr) textsToTranslate.name_fr = fields.name_fr;
    if (fields.description_fr) textsToTranslate.description_fr = fields.description_fr;
    if (fields.story_fr) textsToTranslate.story_fr = fields.story_fr;
    if (fields.materials_fr) textsToTranslate.materials_fr = fields.materials_fr;
    if (fields.care_fr) textsToTranslate.care_fr = fields.care_fr;

    let translations: Record<string, string> = {};
    if (Object.keys(textsToTranslate).length > 0) {
      translations = await translateTexts(textsToTranslate);
      if (Object.keys(translations).length === 0) {
        warnings.push({ severity: 'warning', message: `${r.referenceCode}: Traduction échouée, fallback FR→EN appliqué` });
        for (const [k, v] of Object.entries(textsToTranslate)) {
          translations[k.replace('_fr', '_en')] = v;
        }
      }
    }

    // Handle editorial blocks translation
    let editorialJson: any = undefined;
    if (_editorial_blocks_fr) {
      const translatedBlocks = await translateEditorialBlocks(_editorial_blocks_fr);
      editorialJson = translatedBlocks;
    }

    const payload: any = {
      ...fields,
      name_en: translations.name_en || fields.name_fr,
      description_en: translations.description_en || fields.description_fr || '',
      story_en: translations.story_en || fields.story_fr || '',
      materials_en: translations.materials_en || fields.materials_fr || '',
      care_en: translations.care_en || fields.care_fr || '',
    };

    if (editorialJson) {
      payload.editorial_blocks_json = JSON.parse(JSON.stringify(editorialJson));
    }

    if (r.status === 'CREATE') {
      payload.images = [];
      const { error } = await supabase.from('products').insert(payload);
      if (error) throw new Error(`Erreur création ${r.referenceCode}: ${error.message}`);
    } else {
      const id = r.data._candidateId;
      if (!id) continue;
      const { error } = await supabase.from('products').update(payload).eq('id', id);
      if (error) throw new Error(`Erreur mise à jour ${r.referenceCode}: ${error.message}`);
    }
  }

  return warnings;
}
