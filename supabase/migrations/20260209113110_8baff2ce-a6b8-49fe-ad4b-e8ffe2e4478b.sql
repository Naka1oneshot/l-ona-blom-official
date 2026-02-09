-- Allow public read of measurement_fields setting
DROP POLICY IF EXISTS "Public can read public settings" ON public.site_settings;
CREATE POLICY "Public can read public settings"
ON public.site_settings
FOR SELECT
USING (
  key = ANY (ARRAY[
    'brand', 'shipping_rules', 'legal_mentions', 'legal_cgv', 'legal_privacy',
    'legal_cookies', 'supported_currencies', 'supported_countries', 'coming_soon',
    'theme', 'editorial_font_scale', 'measurement_fields'
  ])
  OR key ~~ 'page_%'
);