
-- ============================================================
-- SHIPPING MODULE — Complete schema migration
-- ============================================================

-- -------------------------------------------------------
-- A) user_addresses (replaces old addresses table)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('billing','shipping')),
  is_default boolean NOT NULL DEFAULT false,
  label text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  company text,
  vat_number text,
  address1 text NOT NULL,
  address2 text,
  city text NOT NULL,
  postal_code text NOT NULL,
  region text,
  country_code text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only 1 billing address per user
CREATE UNIQUE INDEX idx_user_addresses_billing_unique
  ON public.user_addresses (user_id) WHERE type = 'billing';

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON public.user_addresses FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all addresses"
  ON public.user_addresses FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- -------------------------------------------------------
-- B) Shipping zones
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr text NOT NULL,
  name_en text,
  description_fr text,
  description_en text,
  customs_notice boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shipping zones"
  ON public.shipping_zones FOR SELECT USING (true);

CREATE POLICY "Admins can manage shipping zones"
  ON public.shipping_zones FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.shipping_zone_countries (
  zone_id uuid NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  PRIMARY KEY (zone_id, country_code)
);

ALTER TABLE public.shipping_zone_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read zone countries"
  ON public.shipping_zone_countries FOR SELECT USING (true);

CREATE POLICY "Admins can manage zone countries"
  ON public.shipping_zone_countries FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- -------------------------------------------------------
-- C) Shipping size classes
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_size_classes (
  code text PRIMARY KEY,
  label_fr text NOT NULL,
  label_en text,
  weight_points numeric NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.shipping_size_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read size classes"
  ON public.shipping_size_classes FOR SELECT USING (true);

CREATE POLICY "Admins can manage size classes"
  ON public.shipping_size_classes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default size classes
INSERT INTO public.shipping_size_classes (code, label_fr, label_en, weight_points, sort_order) VALUES
  ('VERY_SMALL', 'Très Petit', 'Very Small', 0.5, 1),
  ('SMALL', 'Petit', 'Small', 1, 2),
  ('MEDIUM', 'Moyen', 'Medium', 2, 3),
  ('LARGE', 'Grand', 'Large', 3, 4),
  ('VERY_LARGE', 'Très Grand', 'Very Large', 5, 5)
ON CONFLICT (code) DO NOTHING;

-- -------------------------------------------------------
-- D) Products: add shipping_size_class_code + lead_time_days
-- -------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shipping_size_class_code text REFERENCES public.shipping_size_classes(code),
  ADD COLUMN IF NOT EXISTS lead_time_days int;

-- -------------------------------------------------------
-- E) Shipping methods
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_fr text NOT NULL,
  name_en text,
  description_fr text,
  description_en text,
  is_active boolean NOT NULL DEFAULT true,
  supports_insurance boolean NOT NULL DEFAULT true,
  supports_signature boolean NOT NULL DEFAULT true,
  supports_gift_wrap boolean NOT NULL DEFAULT true,
  eta_min_days int,
  eta_max_days int,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shipping methods"
  ON public.shipping_methods FOR SELECT USING (true);

CREATE POLICY "Admins can manage shipping methods"
  ON public.shipping_methods FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default methods
INSERT INTO public.shipping_methods (code, name_fr, name_en, eta_min_days, eta_max_days, sort_order) VALUES
  ('standard', 'Standard', 'Standard', 5, 10, 1),
  ('express', 'Express', 'Express', 2, 4, 2),
  ('pickup_point', 'Point Relais', 'Pickup Point', 4, 8, 3),
  ('atelier_pickup', 'Retrait Atelier', 'Atelier Pickup', 0, 0, 4)
ON CONFLICT (code) DO NOTHING;

-- -------------------------------------------------------
-- F) Shipping options
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_fr text NOT NULL,
  name_en text,
  description_fr text,
  description_en text,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.shipping_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shipping options"
  ON public.shipping_options FOR SELECT USING (true);

CREATE POLICY "Admins can manage shipping options"
  ON public.shipping_options FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.shipping_options (code, name_fr, name_en) VALUES
  ('insurance', 'Assurance', 'Insurance'),
  ('signature', 'Signature', 'Signature'),
  ('gift_wrap', 'Colis Cadeau', 'Gift Wrap')
ON CONFLICT (code) DO NOTHING;

-- -------------------------------------------------------
-- G) Shipping rate rules
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_rate_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  method_id uuid NOT NULL REFERENCES public.shipping_methods(id) ON DELETE CASCADE,
  min_subtotal_eur numeric NOT NULL DEFAULT 0,
  max_subtotal_eur numeric,
  min_weight_points numeric NOT NULL DEFAULT 0,
  max_weight_points numeric,
  price_eur numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  priority int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_rate_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shipping rate rules"
  ON public.shipping_rate_rules FOR SELECT USING (true);

CREATE POLICY "Admins can manage shipping rate rules"
  ON public.shipping_rate_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- -------------------------------------------------------
-- H) Free shipping thresholds
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_free_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  method_id uuid REFERENCES public.shipping_methods(id) ON DELETE CASCADE,
  threshold_eur numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.shipping_free_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read free thresholds"
  ON public.shipping_free_thresholds FOR SELECT USING (true);

CREATE POLICY "Admins can manage free thresholds"
  ON public.shipping_free_thresholds FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- -------------------------------------------------------
-- Shipping option prices
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_option_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES public.shipping_options(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  method_id uuid REFERENCES public.shipping_methods(id) ON DELETE CASCADE,
  price_eur numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.shipping_option_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read option prices"
  ON public.shipping_option_prices FOR SELECT USING (true);

CREATE POLICY "Admins can manage option prices"
  ON public.shipping_option_prices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- -------------------------------------------------------
-- I) Tax settings
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tax_settings (
  id int PRIMARY KEY DEFAULT 1,
  vat_enabled boolean NOT NULL DEFAULT false,
  vat_rate numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tax settings"
  ON public.tax_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage tax settings"
  ON public.tax_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.tax_settings (id, vat_enabled, vat_rate) VALUES (1, false, 0)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- K) Orders: add shipping columns
-- -------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS billing_address_json jsonb,
  ADD COLUMN IF NOT EXISTS shipping_zone_id uuid,
  ADD COLUMN IF NOT EXISTS shipping_method_id uuid,
  ADD COLUMN IF NOT EXISTS shipping_options_json jsonb,
  ADD COLUMN IF NOT EXISTS shipment_preference text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS shipping_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_currency text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS customs_notice_shown boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS estimated_ship_start_date date,
  ADD COLUMN IF NOT EXISTS estimated_delivery_date date,
  ADD COLUMN IF NOT EXISTS tracking_carrier text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
