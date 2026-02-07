import { supabase } from '@/integrations/supabase/client';
import { normText, normList, normDate, arraysEqual, colFuzzy } from './normalize';
import type { PreviewRow, ImportReport, ImportStats, RowMessage } from './types';

function col(raw: Record<string, any>, ...aliases: string[]): any {
  return colFuzzy(raw, ...aliases);
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

function parseRow(raw: Record<string, any>) {
  return {
    reference_code: normText(col(raw, 'Référence Collection', 'reference_code')),
    slug: normText(col(raw, 'Slug', 'slug')),
    title_fr: normText(col(raw, 'Titre (FR)', 'Titre FR', 'title_fr')),
    subtitle_fr: normText(col(raw, 'Sous-titre (FR)', 'Sous-titre FR', 'subtitle_fr')),
    narrative_fr: normText(col(raw, 'Narratif (FR)', 'Narratif FR', 'narrative_fr')),
    published_at: normDate(col(raw, 'Date de publication (YYYY-MM-DD)', 'Date de publication', 'published_at')),
    tags: normList(col(raw, 'Tags (séparés par |)', 'Tags separes par', 'tags')),
    _product_slugs: normList(col(raw, 'Produits (slugs séparés par |)', 'Produits slugs separes par', 'product_slugs')),
  };
}

/* Compare FR-only (no EN comparison) */
function compareFields(parsed: any, existing: any): string[] {
  const changes: string[] = [];
  const textFields = ['slug', 'title_fr', 'subtitle_fr', 'narrative_fr'];
  for (const f of textFields) {
    if (normText(parsed[f]) !== normText(existing[f] ?? '')) changes.push(f);
  }
  const pDate = normText(parsed.published_at ?? '');
  const eDate = normText((existing.published_at ?? '').slice(0, 10));
  if (pDate !== eDate) changes.push('published_at');

  const eTags = [...(existing.tags || [])].sort();
  if (!arraysEqual(parsed.tags, eTags)) changes.push('tags');

  return changes;
}

export async function previewCollectionImport(rows: Record<string, any>[]): Promise<ImportReport> {
  const { data: existing } = await supabase.from('collections').select('*');
  const byRef = new Map<string, any>();
  const bySlug = new Map<string, any>();
  for (const c of existing || []) {
    if (c.reference_code) byRef.set(c.reference_code, c);
    bySlug.set(c.slug, c);
  }

  const { data: products } = await supabase.from('products').select('id, slug');
  const productBySlug = new Map<string, string>();
  for (const p of products || []) productBySlug.set(p.slug, p.id);

  const preview: PreviewRow[] = [];
  const slugsInFile = new Map<string, number>();
  const stats: ImportStats = { created: 0, updated: 0, no_change: 0, errors: 0, warnings: 0 };

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const messages: RowMessage[] = [];
    const ref = normText(col(raw, 'Référence Collection', 'reference_code'));
    const slug = normText(col(raw, 'Slug', 'slug'));

    if (!ref || !/^COL\d{3,}$/.test(ref)) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'Titre (FR)', 'Titre FR', 'title_fr')), status: 'ERROR', messages: [{ severity: 'error', message: `Référence invalide: "${ref}" (format: COL001)` }], data: raw });
      stats.errors++;
      continue;
    }
    if (!slug) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'Titre (FR)', 'Titre FR', 'title_fr')), status: 'ERROR', messages: [{ severity: 'error', message: 'Slug manquant' }], data: raw });
      stats.errors++;
      continue;
    }
    if (slugsInFile.has(slug)) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(col(raw, 'Titre (FR)', 'Titre FR', 'title_fr')), status: 'ERROR', messages: [{ severity: 'error', message: `Slug "${slug}" dupliqué (ligne ${slugsInFile.get(slug)})` }], data: raw });
      stats.errors++;
      continue;
    }
    slugsInFile.set(slug, i + 2);

    const parsed = parseRow(raw);

    if (!parsed.published_at) {
      messages.push({ severity: 'error', message: 'Date de publication requise' });
    }

    const validProductIds: string[] = [];
    for (const ps of parsed._product_slugs) {
      const pid = productBySlug.get(ps);
      if (!pid) {
        messages.push({ severity: 'warning', message: `Produit "${ps}" introuvable, ignoré` });
        stats.warnings++;
      } else {
        validProductIds.push(pid);
      }
    }

    // Matching: ref first, then slug
    let candidate: any = byRef.get(ref);
    if (!candidate) {
      const slugOwner = bySlug.get(slug);
      if (slugOwner) {
        if (!slugOwner.reference_code) {
          candidate = slugOwner;
          messages.push({ severity: 'warning', message: `Référence ${ref} attribuée à la collection existante (slug: ${slug})` });
          stats.warnings++;
        } else if (slugOwner.reference_code === ref) {
          candidate = slugOwner;
        } else {
          preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.title_fr, status: 'ERROR', messages: [{ severity: 'error', message: `Slug "${slug}" utilisé par une autre collection (ref: ${slugOwner.reference_code})` }], data: raw });
          stats.errors++;
          continue;
        }
      }
    }

    if (messages.some(m => m.severity === 'error')) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.title_fr, status: 'ERROR', messages, data: raw });
      stats.errors++;
      continue;
    }

    if (candidate) {
      const changes = compareFields(parsed, candidate);
      if (!candidate.reference_code && !changes.includes('reference_code')) changes.push('reference_code');
      if (changes.length === 0) {
        preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.title_fr, status: 'NO_CHANGE', messages, data: { ...raw, _validProductIds: validProductIds, _candidateId: candidate.id } });
        stats.no_change++;
      } else {
        preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.title_fr, status: 'UPDATE', messages, data: { ...raw, _validProductIds: validProductIds, _candidateId: candidate.id }, changes });
        stats.updated++;
      }
    } else {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.title_fr, status: 'CREATE', messages, data: { ...raw, _validProductIds: validProductIds } });
      stats.created++;
    }
  }

  return { rows: preview, stats };
}

export async function executeCollectionImport(
  previewRows: PreviewRow[],
  onProgress?: (current: number, total: number, label: string) => void
): Promise<RowMessage[]> {
  const toProcess = previewRows.filter(r => r.status === 'CREATE' || r.status === 'UPDATE');
  const warnings: RowMessage[] = [];
  const total = toProcess.length;

  for (let idx = 0; idx < toProcess.length; idx++) {
    const r = toProcess[idx];
    onProgress?.(idx + 1, total, r.label || r.slug);

    const parsed = parseRow(r.data);
    const { _product_slugs, ...fields } = parsed;
    const pubAt = fields.published_at ? `${fields.published_at}T00:00:00` : null;

    // Auto-translate FR -> EN
    const textsToTranslate: Record<string, string> = {};
    if (fields.title_fr) textsToTranslate.title_fr = fields.title_fr;
    if (fields.subtitle_fr) textsToTranslate.subtitle_fr = fields.subtitle_fr;
    if (fields.narrative_fr) textsToTranslate.narrative_fr = fields.narrative_fr;

    let translations: Record<string, string> = {};
    if (Object.keys(textsToTranslate).length > 0) {
      translations = await translateTexts(textsToTranslate);
      if (Object.keys(translations).length === 0) {
        warnings.push({ severity: 'warning', message: `${r.referenceCode}: Traduction échouée, fallback FR→EN` });
        for (const [k, v] of Object.entries(textsToTranslate)) {
          translations[k.replace('_fr', '_en')] = v;
        }
      }
    }

    const payload: any = {
      ...fields,
      published_at: pubAt,
      title_en: translations.title_en || fields.title_fr,
      subtitle_en: translations.subtitle_en || fields.subtitle_fr || '',
      narrative_en: translations.narrative_en || fields.narrative_fr || '',
    };

    if (r.status === 'CREATE') {
      const { data: created, error } = await supabase.from('collections').insert(payload).select('id').single();
      if (error) throw new Error(`Erreur création ${r.referenceCode}: ${error.message}`);

      const productIds: string[] = r.data._validProductIds || [];
      if (productIds.length > 0 && created) {
        const links = productIds.map((pid: string, i: number) => ({
          collection_id: created.id, product_id: pid, sort_order: i,
        }));
        await supabase.from('collection_products').insert(links);
      }
    } else {
      const id = r.data._candidateId;
      if (!id) continue;
      const { error } = await supabase.from('collections').update(payload).eq('id', id);
      if (error) throw new Error(`Erreur update ${r.referenceCode}: ${error.message}`);

      const productIds: string[] = r.data._validProductIds || [];
      await supabase.from('collection_products').delete().eq('collection_id', id);
      if (productIds.length > 0) {
        const links = productIds.map((pid: string, i: number) => ({
          collection_id: id, product_id: pid, sort_order: i,
        }));
        await supabase.from('collection_products').insert(links);
      }
    }
  }

  return warnings;
}
