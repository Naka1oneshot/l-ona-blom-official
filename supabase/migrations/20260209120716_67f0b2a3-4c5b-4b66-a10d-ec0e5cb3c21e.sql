-- Add per-size stock tracking
ALTER TABLE public.products
ADD COLUMN stock_by_size jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Migrate existing stock_qty to stock_by_size for products that have sizes
-- For TU products: {"TU": stock_qty}
-- For standard size products: distribute stock_qty equally (admin can adjust later)
UPDATE public.products
SET stock_by_size = jsonb_build_object('TU', stock_qty)
WHERE stock_qty IS NOT NULL
  AND sizes = ARRAY['TU'];

COMMENT ON COLUMN public.products.stock_by_size IS 'Per-size stock quantities, e.g. {"S": 3, "M": 0, "L": 5}. Empty or missing key = unlimited.';