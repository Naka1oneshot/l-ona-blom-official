
-- Add new columns to products for AI try-on
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tryon_garment_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tryon_garment_image_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tryon_ai_enabled boolean NOT NULL DEFAULT false;

-- Update site_features config for virtual_tryon
UPDATE public.site_features
SET config = jsonb_set(
  config,
  '{mode}',
  '"ai_leffa"'
),
updated_at = now()
WHERE key = 'virtual_tryon';
