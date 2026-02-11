import { siteConfig } from '@/lib/siteConfig';
import type { Product } from '@/types';
import { getPriceRange } from '@/lib/pricing';

/**
 * Organization JSON-LD — inject once on the homepage or layout.
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.brand,
    url: siteConfig.siteUrl,
    logo: `${siteConfig.siteUrl}/favicon.png`,
    sameAs: [
      siteConfig.instagram,
      siteConfig.facebook,
      siteConfig.pinterest,
      siteConfig.youtube,
      siteConfig.tiktok,
    ].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.contactEmail,
      contactType: 'customer service',
    },
  };
}

/**
 * WebSite JSON-LD with search action.
 */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.brand,
    url: siteConfig.siteUrl,
  };
}

/**
 * BreadcrumbList JSON-LD.
 */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Product JSON-LD for product detail pages.
 */
export function productJsonLd(
  product: Product,
  language: string,
) {
  const name = language === 'fr' ? product.name_fr : (product.name_en || product.name_fr);
  const description = language === 'fr'
    ? (product.description_fr || product.story_fr || '')
    : (product.description_en || product.story_en || product.description_fr || product.story_fr || '');

  const priceRange = getPriceRange(product);
  const price = (priceRange.min / 100).toFixed(2);

  // Determine availability
  let availability = 'https://schema.org/InStock';
  if (product.preorder) {
    availability = 'https://schema.org/PreOrder';
  } else if (product.made_to_order || product.made_to_measure) {
    availability = 'https://schema.org/InStock'; // available on demand
  } else if (product.stock_qty !== null && product.stock_qty <= 0) {
    availability = 'https://schema.org/OutOfStock';
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: truncate(description, 5000),
    image: product.images.filter(Boolean),
    sku: (product as any).reference_code || product.slug,
    brand: {
      '@type': 'Brand',
      name: siteConfig.brand,
    },
    url: `${siteConfig.siteUrl}/boutique/${product.slug}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price,
      availability,
      url: `${siteConfig.siteUrl}/boutique/${product.slug}`,
    },
  };
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).trimEnd() + '…';
}
