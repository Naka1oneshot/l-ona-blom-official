const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const OBJECT_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/`;
const RENDER_PREFIX = `${SUPABASE_URL}/storage/v1/render/image/public/`;

/**
 * Optimise a Supabase Storage public URL using the /render/image/ transform endpoint.
 * Non-Supabase URLs are returned as-is.
 */
export function optimizeImage(
  url: string | undefined | null,
  opts: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return '';
  // Only transform Supabase storage URLs
  if (!url.startsWith(OBJECT_PREFIX)) return url;

  // Switch from /object/public/ to /render/image/public/
  const path = url.slice(OBJECT_PREFIX.length).split('?')[0]; // strip existing params
  const params = new URLSearchParams();
  if (opts.width) params.set('width', String(opts.width));
  if (opts.height) params.set('height', String(opts.height));
  params.set('quality', String(opts.quality ?? 80));

  return `${RENDER_PREFIX}${path}?${params.toString()}`;
}

/** Check if a URL is a Supabase Storage URL */
export const isSupabaseUrl = (url: string) => url.startsWith(OBJECT_PREFIX);

/** Preset for product card thumbnails */
export const cardImage = (url: string) => optimizeImage(url, { width: 400, quality: 70 });

/** Preset for product detail gallery */
export const detailImage = (url: string) => optimizeImage(url, { width: 1200 });

/** Preset for collection covers */
export const coverImage = (url: string) => optimizeImage(url, { width: 1200, quality: 75 });

/** Ultra-small blurred placeholder (20px wide) */
export const blurImage = (url: string) => optimizeImage(url, { width: 20, quality: 20 });

/** Default responsive breakpoints */
const CARD_WIDTHS = [400, 800];
const DETAIL_WIDTHS = [800, 1200, 1800];

/**
 * Generate a srcSet string for responsive images.
 * Only works on Supabase Storage URLs; returns empty string otherwise.
 */
export function generateSrcSet(
  url: string | undefined | null,
  preset: 'card' | 'detail' = 'card',
  quality = 80,
): string {
  if (!url || !url.startsWith(OBJECT_PREFIX)) return '';
  const widths = preset === 'detail' ? DETAIL_WIDTHS : CARD_WIDTHS;
  return widths
    .map(w => `${optimizeImage(url, { width: w, quality })} ${w}w`)
    .join(', ');
}
