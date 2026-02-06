export type Language = 'fr' | 'en';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CAD';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CAD: 'CA$',
};

export interface Product {
  id: string;
  slug: string;
  status: 'active' | 'draft';
  category: string;
  name_fr: string;
  name_en: string;
  description_fr: string;
  description_en: string;
  story_fr: string;
  story_en: string;
  materials_fr: string;
  materials_en: string;
  care_fr: string;
  care_en: string;
  base_price_eur: number; // cents
  price_overrides: Partial<Record<Currency, number>>;
  made_to_order: boolean;
  made_to_order_min_days?: number;
  made_to_order_max_days?: number;
  made_to_measure: boolean;
  preorder: boolean;
  preorder_ship_date_estimate?: string;
  images: string[];
  sizes: string[];
  colors: string[];
  materials: string[];
  braiding_options: string[];
  stock_qty: number | null;
}

export interface Collection {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  subtitle_fr: string;
  subtitle_en: string;
  narrative_fr: string;
  narrative_en: string;
  cover_image: string;
  gallery_images: string[];
  published_at: string;
  tags: string[];
  product_ids: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  content_fr: string;
  content_en: string;
  cover_image: string;
  published_at: string;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  braiding?: string;
}
