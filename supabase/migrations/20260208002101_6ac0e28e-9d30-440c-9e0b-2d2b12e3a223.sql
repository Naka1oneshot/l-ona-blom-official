ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS braiding_colors text[] NOT NULL DEFAULT '{}'::text[];