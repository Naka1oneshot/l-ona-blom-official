import { supabase } from '@/integrations/supabase/client';
import { normText, normList, normDate, arraysEqual } from './normalize';
import type { PreviewRow, ImportReport, ImportStats, RowMessage } from './types';

function parseRow(raw: Record<string, any>) {
  return {
    reference_code: normText(raw['Référence Produit']),
    slug: normText(raw['slug']),
    title_fr: normText(raw['title_fr']),
    title_en: normText(raw['title_en']),
    subtitle_fr: normText(raw['subtitle_fr']),
    subtitle_en: normText(raw['subtitle_en']),
    narrative_fr: normText(raw['narrative_fr']),
    narrative_en: normText(raw['narrative_en']),
    published_at: normDate(raw['published_at']),
    tags: normList(raw['tags']),
    _product_slugs: normList(raw['product_slugs']),
  };
}

function compareFields(parsed: any, existing: any): string[] {
  const changes: string[] = [];
  const textFields = ['slug', 'title_fr', 'title_en', 'subtitle_fr', 'subtitle_en', 'narrative_fr', 'narrative_en'];
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

  // Fetch products for product_slugs validation
  const { data: products } = await supabase.from('products').select('id, slug');
  const productBySlug = new Map<string, string>();
  for (const p of products || []) productBySlug.set(p.slug, p.id);

  const preview: PreviewRow[] = [];
  const slugsInFile = new Map<string, number>();
  const stats: ImportStats = { created: 0, updated: 0, no_change: 0, errors: 0, warnings: 0 };

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const messages: RowMessage[] = [];
    const ref = normText(raw['Référence Produit']);
    const slug = normText(raw['slug']);

    if (!ref || !/^COL\d{3,}$/.test(ref)) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(raw['title_fr']), status: 'ERROR', messages: [{ severity: 'error', message: `Référence invalide: "${ref}" (format: COL001)` }], data: raw });
      stats.errors++;
      continue;
    }
    if (!slug) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(raw['title_fr']), status: 'ERROR', messages: [{ severity: 'error', message: 'Slug manquant' }], data: raw });
      stats.errors++;
      continue;
    }
    if (slugsInFile.has(slug)) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: normText(raw['title_fr']), status: 'ERROR', messages: [{ severity: 'error', message: `Slug "${slug}" dupliqué (ligne ${slugsInFile.get(slug)})` }], data: raw });
      stats.errors++;
      continue;
    }
    slugsInFile.set(slug, i + 2);

    const parsed = parseRow(raw);

    // Validate published_at
    if (!parsed.published_at) {
      messages.push({ severity: 'error', message: 'published_at requis (date valide)' });
    }

    // Validate product_slugs
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

    // Slug collision
    const slugOwner = bySlug.get(slug);
    if (slugOwner && slugOwner.reference_code !== ref && !byRef.has(ref)) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.title_fr, status: 'ERROR', messages: [{ severity: 'error', message: `Slug "${slug}" déjà utilisé par une autre collection` }], data: raw });
      stats.errors++;
      continue;
    }

    if (messages.some(m => m.severity === 'error')) {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.title_fr, status: 'ERROR', messages, data: raw });
      stats.errors++;
      continue;
    }

    const existingCol = byRef.get(ref);
    if (existingCol) {
      const changes = compareFields(parsed, existingCol);
      // We'll also update product links regardless
      if (changes.length === 0) {
        preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.title_fr, status: 'NO_CHANGE', messages, data: { ...raw, _validProductIds: validProductIds } });
        stats.no_change++;
      } else {
        preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.title_fr, status: 'UPDATE', messages, data: { ...raw, _validProductIds: validProductIds }, changes });
        stats.updated++;
      }
    } else {
      preview.push({ rowIndex: i + 2, referenceCode: ref, slug, label: parsed.title_fr, status: 'CREATE', messages, data: { ...raw, _validProductIds: validProductIds } });
      stats.created++;
    }
  }

  return { rows: preview, stats };
}

export async function executeCollectionImport(previewRows: PreviewRow[]): Promise<void> {
  const { data: existing } = await supabase.from('collections').select('id, reference_code');
  const byRef = new Map<string, string>();
  for (const c of existing || []) {
    if (c.reference_code) byRef.set(c.reference_code, c.id);
  }

  const toCreate = previewRows.filter(r => r.status === 'CREATE');
  const toUpdate = previewRows.filter(r => r.status === 'UPDATE');

  // Create collections
  for (const r of toCreate) {
    const p = parseRow(r.data);
    const { _product_slugs, ...insertData } = p;
    const pubAt = insertData.published_at ? `${insertData.published_at}T00:00:00` : null;
    const { data: created, error } = await supabase.from('collections').insert({
      ...insertData,
      published_at: pubAt,
    }).select('id').single();
    if (error) throw new Error(`Erreur création ${r.referenceCode}: ${error.message}`);

    // Link products
    const productIds: string[] = r.data._validProductIds || [];
    if (productIds.length > 0 && created) {
      const links = productIds.map((pid, idx) => ({
        collection_id: created.id,
        product_id: pid,
        sort_order: idx,
      }));
      await supabase.from('collection_products').insert(links);
    }
  }

  // Update collections
  for (const r of toUpdate) {
    const p = parseRow(r.data);
    const { _product_slugs, reference_code, ...updateData } = p;
    const id = byRef.get(r.referenceCode);
    if (!id) continue;
    const pubAt = updateData.published_at ? `${updateData.published_at}T00:00:00` : null;
    const { error } = await supabase.from('collections').update({
      ...updateData,
      published_at: pubAt,
    }).eq('id', id);
    if (error) throw new Error(`Erreur update ${r.referenceCode}: ${error.message}`);

    // Re-sync product links
    const productIds: string[] = r.data._validProductIds || [];
    await supabase.from('collection_products').delete().eq('collection_id', id);
    if (productIds.length > 0) {
      const links = productIds.map((pid, idx) => ({
        collection_id: id,
        product_id: pid,
        sort_order: idx,
      }));
      await supabase.from('collection_products').insert(links);
    }
  }
}
