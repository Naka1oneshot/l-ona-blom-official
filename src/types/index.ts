export type Language = 'fr' | 'en';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CAD';
export type SizeCode = 'TU' | 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

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
  price_by_size_eur: Record<string, number>;
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
  braiding_colors: string[];
  color_hex_map: Record<string, string>;
  stock_qty: number | null;
  editorial_blocks_json: any[] | null;
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

export interface MeasurementData {
  bust: string;
  waist: string;
  hips: string;
  shoulder_width: string;
  arm_length: string;
  total_length: string;
  notes: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  braiding?: string;
  braiding_color?: string;
  unit_price_eur_cents?: number;
  measurements?: MeasurementData;
}
