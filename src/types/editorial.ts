export interface EditorialBlock {
  id: string;
  title_fr: string;
  title_en: string;
  body_fr: string;
  body_en: string;
  image_index: number | null;
  style: 'default' | 'quote' | 'callout' | 'materials' | 'care';
  alignment?: 'left' | 'right';
}

export const EDITORIAL_STYLES = [
  { value: 'default', label: 'Récit' },
  { value: 'quote', label: 'Citation' },
  { value: 'callout', label: 'Encart' },
  { value: 'materials', label: 'Matières' },
  { value: 'care', label: 'Entretien' },
] as const;

/** Generate fallback editorial blocks from legacy product fields */
export function generateFallbackBlocks(product: {
  story_fr: string;
  story_en: string;
  materials_fr: string;
  materials_en: string;
  care_fr: string;
  care_en: string;
  images: string[];
}): EditorialBlock[] {
  const blocks: EditorialBlock[] = [];
  let idx = 0;

  if (product.story_fr) {
    blocks.push({
      id: 'fallback-story',
      title_fr: 'Trésor à porter',
      title_en: 'A Treasure to Wear',
      body_fr: product.story_fr,
      body_en: product.story_en || '',
      image_index: Math.min(idx, product.images.length - 1),
      style: 'default',
    });
    idx++;
  }

  if (product.materials_fr) {
    blocks.push({
      id: 'fallback-materials',
      title_fr: 'Matières',
      title_en: 'Materials',
      body_fr: product.materials_fr,
      body_en: product.materials_en || '',
      image_index: Math.min(idx, product.images.length - 1),
      style: 'materials',
    });
    idx++;
  }

  if (product.care_fr) {
    blocks.push({
      id: 'fallback-care',
      title_fr: 'Entretien',
      title_en: 'Care',
      body_fr: product.care_fr,
      body_en: product.care_en || '',
      image_index: Math.min(idx, product.images.length - 1),
      style: 'care',
    });
  }

  return blocks;
}
