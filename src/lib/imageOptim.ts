const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/`;

/**
 * Optimise a Supabase Storage public URL by appending image transformation params.
 * Non-Supabase URLs are returned as-is.
 */
export function optimizeImage(
  url: string | undefined | null,
  opts: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return '';
  // Only transform Supabase storage URLs
  if (!url.startsWith(STORAGE_PREFIX)) return url;

  const params = new URLSearchParams();
  if (opts.width) params.set('width', String(opts.width));
  if (opts.height) params.set('height', String(opts.height));
  params.set('quality', String(opts.quality ?? 80));
  params.set('format', 'webp');

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

/** Preset for product card thumbnails */
export const cardImage = (url: string) => optimizeImage(url, { width: 600 });

/** Preset for product detail gallery */
export const detailImage = (url: string) => optimizeImage(url, { width: 1200 });

/** Preset for collection covers */
export const coverImage = (url: string) => optimizeImage(url, { width: 1400 });
