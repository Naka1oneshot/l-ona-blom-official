ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stripe_product_id text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stripe_price_id text;