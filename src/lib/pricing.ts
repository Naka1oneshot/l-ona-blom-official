import type { Product, SizeCode } from '@/types';

export const STANDARD_SIZES: SizeCode[] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
export const ALL_SIZE_CODES: SizeCode[] = ['TU', ...STANDARD_SIZES];

/** Determine sizes from a size_set string */
export function normalizeSizesFromSet(sizeSet: string): SizeCode[] {
  const s = sizeSet.trim().toUpperCase();
  if (s === 'TU') return ['TU'];
  return [...STANDARD_SIZES];
}

/** Detect the size set from a product's sizes array */
export function detectSizeSet(sizes: string[]): 'TU' | 'standard' {
  if (sizes.length === 1 && sizes[0] === 'TU') return 'TU';
  return 'standard';
}

/**
 * Get unit price in EUR cents for a product, optionally for a specific size.
 * Priority: price_by_size_eur[size] > base_price_eur
 */
export function getUnitPriceEurCents(product: Product, size?: string): number {
  const priceMap = product.price_by_size_eur || {};

  if (size && priceMap[size] != null) {
    return priceMap[size];
  }

  // If TU product, try TU price
  if (product.sizes.length === 1 && product.sizes[0] === 'TU' && priceMap['TU'] != null) {
    return priceMap['TU'];
  }

  // Fallback: min of available prices or base_price_eur
  const values = Object.values(priceMap).filter((v): v is number => v != null && v > 0);
  if (values.length > 0) return Math.min(...values);

  return product.base_price_eur;
}

/** Get the display price range string for a product (e.g. "from X") */
export function getPriceRange(product: Product): { min: number; max: number; hasRange: boolean } {
  const priceMap = product.price_by_size_eur || {};
  const values = Object.values(priceMap).filter((v): v is number => v != null && v > 0);

  if (values.length === 0) {
    return { min: product.base_price_eur, max: product.base_price_eur, hasRange: false };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, hasRange: min !== max };
}

/** Build price_by_size_eur from admin form and compute base_price_eur */
export function buildPriceBySizePayload(
  sizeSet: 'TU' | 'standard',
  prices: Record<string, number>
): { sizes: SizeCode[]; price_by_size_eur: Record<string, number>; base_price_eur: number } {
  const sizes = sizeSet === 'TU' ? ['TU'] as SizeCode[] : [...STANDARD_SIZES];
  const price_by_size_eur: Record<string, number> = {};

  for (const s of sizes) {
    price_by_size_eur[s] = prices[s] || 0;
  }

  const values = Object.values(price_by_size_eur).filter(v => v > 0);
  const base_price_eur = values.length > 0 ? Math.min(...values) : 0;

  return { sizes, price_by_size_eur, base_price_eur };
}
