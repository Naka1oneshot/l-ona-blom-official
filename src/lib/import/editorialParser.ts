import type { EditorialBlock } from '@/types/editorial';
import { normText } from './normalize';

/**
 * Parse editorial blocks from an Excel cell using delimiter format:
 * Blocks separated by ";;"
 * Fields within a block separated by "||"
 * Format: title||body||style||image_index
 */
export function parseEditorialBlocks(raw: string | null | undefined): EditorialBlock[] | null {
  if (!raw || !String(raw).trim()) return null;

  const str = String(raw).trim();
  const blockStrings = str.split(';;').map(s => s.trim()).filter(Boolean);
  const blocks: EditorialBlock[] = [];

  for (let i = 0; i < blockStrings.length; i++) {
    const parts = blockStrings[i].split('||').map(s => s.trim());
    const title = parts[0] || '';
    const body = parts[1] || '';
    const style = (parts[2] || 'default') as EditorialBlock['style'];
    const imageIndexRaw = parts[3];
    const imageIndex = imageIndexRaw != null && imageIndexRaw !== '' ? parseInt(imageIndexRaw, 10) : null;

    if (!title || !body) continue;

    blocks.push({
      id: `blk-import-${i}`,
      title_fr: title,
      title_en: '',
      body_fr: body,
      body_en: '',
      image_index: isNaN(imageIndex as number) ? null : imageIndex,
      style: ['default', 'quote', 'callout', 'materials', 'care'].includes(style) ? style : 'default',
    });
  }

  return blocks.length > 0 ? blocks : null;
}

/**
 * Merge FR and EN editorial blocks parsed from two Excel columns.
 * EN blocks fill in the title_en/body_en of matching FR blocks by index.
 */
export function mergeEditorialBlocksI18n(
  frBlocks: EditorialBlock[] | null,
  enBlocks: EditorialBlock[] | null
): EditorialBlock[] | null {
  if (!frBlocks) return null;
  if (!enBlocks) return frBlocks;

  return frBlocks.map((block, i) => {
    const enBlock = enBlocks[i];
    if (!enBlock) return block;
    return {
      ...block,
      title_en: enBlock.title_fr || block.title_en, // EN column uses same field names
      body_en: enBlock.body_fr || block.body_en,
    };
  });
}

/**
 * Normalize editorial blocks for comparison (trim, sort keys consistently).
 */
export function normalizeEditorialBlocksForDiff(blocks: any[] | null | undefined): string {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return '[]';
  const normalized = blocks.map(b => ({
    title_fr: normText(b.title_fr),
    title_en: normText(b.title_en),
    body_fr: normText(b.body_fr),
    body_en: normText(b.body_en),
    image_index: b.image_index ?? null,
    style: b.style || 'default',
  }));
  return JSON.stringify(normalized);
}
