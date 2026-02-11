
-- 1) Create site_features table
CREATE TABLE public.site_features (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read features"
ON public.site_features FOR SELECT
USING (true);

CREATE POLICY "Admins can manage features"
ON public.site_features FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Init virtual_tryon feature flag
INSERT INTO public.site_features (key, enabled, config)
VALUES ('virtual_tryon', false, '{"allow_without_png": true}'::jsonb);

-- 2) Add tryon columns to products
ALTER TABLE public.products
  ADD COLUMN tryon_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN tryon_type text NULL,
  ADD COLUMN tryon_image_url text NULL,
  ADD COLUMN tryon_fallback_image_index integer NULL,
  ADD COLUMN tryon_offset_x numeric NULL,
  ADD COLUMN tryon_offset_y numeric NULL,
  ADD COLUMN tryon_default_scale numeric NULL;
