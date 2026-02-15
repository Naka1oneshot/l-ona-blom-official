/**
 * Image variant generator — runs at upload time in the admin.
 *
 * For each uploaded image, generates two WebP variants using canvas:
 *   • GRID  (900×1200)  — for shop listing cards
 *   • DETAIL (1800×2400) — for product detail pages
 *
 * The image is scaled with "contain" logic so nothing is cropped.
 * The remaining space is filled with a configurable background colour.
 */

const BG_COLOR = '#FDFDFD';

export interface VariantSpec {
  suffix: string;
  width: number;
  height: number;
  quality: number;
}

export const VARIANTS: VariantSpec[] = [
  { suffix: '__grid', width: 900, height: 1200, quality: 0.82 },
  { suffix: '__detail', width: 1800, height: 2400, quality: 0.88 },
];

/**
 * Load a File / Blob into an HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Given a source image blob, generate a single resized variant
 * with contain-fit and background padding, exported as WebP.
 */
export async function generateVariant(
  file: File | Blob,
  spec: VariantSpec,
  bgColor = BG_COLOR,
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);

    const canvas = document.createElement('canvas');
    canvas.width = spec.width;
    canvas.height = spec.height;
    const ctx = canvas.getContext('2d')!;

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, spec.width, spec.height);

    // Contain-fit scale
    const scale = Math.min(spec.width / img.naturalWidth, spec.height / img.naturalHeight);
    const drawW = Math.round(img.naturalWidth * scale);
    const drawH = Math.round(img.naturalHeight * scale);
    const offsetX = Math.round((spec.width - drawW) / 2);
    const offsetY = Math.round((spec.height - drawH) / 2);

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob failed'))),
        'image/webp',
        spec.quality,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Generate all variants for a given source file.
 * Returns an array of { suffix, blob } ready for upload.
 */
export async function generateAllVariants(
  file: File | Blob,
): Promise<{ suffix: string; blob: Blob }[]> {
  const results: { suffix: string; blob: Blob }[] = [];
  // Sequential to avoid overwhelming the browser with concurrent canvas ops
  for (const spec of VARIANTS) {
    const blob = await generateVariant(file, spec);
    results.push({ suffix: spec.suffix, blob });
  }
  return results;
}

/* ─── URL helpers ─── */

/** Check whether a URL uses the variant naming convention */
export function isVariantUrl(url: string): boolean {
  return url.includes('__grid.webp') || url.includes('__detail.webp');
}

/** Given a variant URL (any variant), derive the URL for a specific suffix */
export function toVariant(url: string, targetSuffix: '__grid' | '__detail'): string {
  if (!isVariantUrl(url)) return url; // legacy URL — return as-is
  return url
    .replace('__grid.webp', `${targetSuffix}.webp`)
    .replace('__detail.webp', `${targetSuffix}.webp`);
}
