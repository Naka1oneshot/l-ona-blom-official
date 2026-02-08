-- Add price_by_size_eur JSONB column
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS price_by_size_eur jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill existing products: set price_by_size_eur from base_price_eur + sizes
UPDATE public.products
SET price_by_size_eur = CASE
  WHEN sizes = ARRAY['TU'] THEN jsonb_build_object('TU', base_price_eur)
  WHEN array_length(sizes, 1) > 0 THEN (
    SELECT jsonb_object_agg(s, base_price_eur)
    FROM unnest(sizes) AS s
  )
  ELSE jsonb_build_object('TU', base_price_eur)
END
WHERE price_by_size_eur = '{}'::jsonb;