-- Add sort_order to products (default 0, lower = first)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Add hover_image_index to products (which image shows on hover in shop grid; null = use index 1)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hover_image_index integer DEFAULT NULL;

-- Add sort_order to collections
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Indexes for ordering
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products (sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON public.collections (sort_order ASC, created_at DESC);