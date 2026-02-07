import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types';

/** Map a Supabase products row to the frontend Product type */
export function mapProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status as 'active' | 'draft',
    category: row.category,
    name_fr: row.name_fr,
    name_en: row.name_en,
    description_fr: row.description_fr || '',
    description_en: row.description_en || '',
    story_fr: row.story_fr || '',
    story_en: row.story_en || '',
    materials_fr: row.materials_fr || '',
    materials_en: row.materials_en || '',
    care_fr: row.care_fr || '',
    care_en: row.care_en || '',
    base_price_eur: row.base_price_eur,
    price_overrides: (row.price_overrides as any) || {},
    made_to_order: row.made_to_order || false,
    made_to_order_min_days: row.made_to_order_min_days ?? undefined,
    made_to_order_max_days: row.made_to_order_max_days ?? undefined,
    made_to_measure: row.made_to_measure || false,
    preorder: row.preorder || false,
    preorder_ship_date_estimate: row.preorder_ship_date_estimate ?? undefined,
    images: row.images || [],
    sizes: row.sizes || [],
    colors: row.colors || [],
    materials: row.materials || [],
    braiding_options: row.braiding_options || [],
    stock_qty: row.stock_qty,
    editorial_blocks_json: row.editorial_blocks_json as any[] | null,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  return (data || []).map(mapProduct);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data ? mapProduct(data) : null;
}

export async function fetchFeaturedProducts(limit = 3): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []).map(mapProduct);
}
