
-- Update public read policy to allow reading page content keys (prefix page_)
DROP POLICY IF EXISTS "Public can read public settings" ON public.site_settings;

CREATE POLICY "Public can read public settings"
ON public.site_settings
FOR SELECT
USING (
  key = ANY (ARRAY[
    'brand', 'shipping_rules', 'legal_mentions', 'legal_cgv', 'legal_privacy', 'legal_cookies',
    'supported_currencies', 'supported_countries'
  ])
  OR key LIKE 'page_%'
);
