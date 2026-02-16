
-- 1) Email templates table
CREATE TABLE public.site_emails_templates (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  subject_fr text NOT NULL DEFAULT '',
  subject_en text NOT NULL DEFAULT '',
  preheader_fr text NOT NULL DEFAULT '',
  preheader_en text NOT NULL DEFAULT '',
  body_fr text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  cta_label_fr text NOT NULL DEFAULT 'Découvrir la boutique',
  cta_label_en text NOT NULL DEFAULT 'Explore the boutique',
  cta_url text NOT NULL DEFAULT '/boutique',
  header_image_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_emails_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON public.site_emails_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role needs to read templates from edge functions (no auth context)
-- We use service_role key in edge function so no public read policy needed

-- 2) Email log table (anti-duplicate)
CREATE TABLE public.user_emails_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  welcome_sent_at timestamptz,
  locale text DEFAULT 'fr'
);

ALTER TABLE public.user_emails_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email logs"
  ON public.user_emails_log FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) Insert default welcome template
INSERT INTO public.site_emails_templates (key, enabled, subject_fr, subject_en, preheader_fr, preheader_en, body_fr, body_en, cta_label_fr, cta_label_en, cta_url, header_image_url)
VALUES (
  'welcome',
  true,
  'Bienvenue chez LÉONA BLOM — votre Trésor à porter vous attend',
  'Welcome to LÉONA BLOM — your wearable treasure awaits',
  'Luxe narratif, sur-mesure, et la règle des 3S : Selflove, Selfcare, Selfplace.',
  'Narrative luxury, made-to-order, and the 3S philosophy.',
  E'Bonjour {{first_name_or_cher_tresor}},\n\nBienvenue dans l''univers LÉONA BLOM.\nIci, chaque pièce est pensée comme un Trésor à porter — précieux, chargé de sens, conçu pour sublimer celles qui le portent.\n\nLÉONA BLOM, c''est aussi une philosophie : la règle des 3S\n• Selflove — s''aimer entièrement\n• Selfcare — se chérir profondément\n• Selfplace — trouver sa place, sans s''excuser\n\nVotre style est un langage. Votre histoire mérite d''être honorée.\nQuand vous êtes prête, découvrez nos collections et nos pièces sur commande.\n\nBesoin d''un conseil (taille, matières, sur-mesure) ?\nRépondez simplement à cet email ou écrivez-nous : contact@leonablom.com',
  E'Hello {{first_name_or_dear}},\n\nWelcome to LÉONA BLOM.\nEach piece is designed as a wearable treasure — meaningful, precious, crafted to elevate the woman who wears it.\n\nOur house philosophy is the 3S:\n• Selflove — love yourself fully\n• Selfcare — cherish yourself deeply\n• Selfplace — claim your space\n\nWhen you''re ready, discover our collections and made-to-order pieces.\n\nNeed help (sizing, fabrics, made-to-measure)?\nReply to this email or contact us at: contact@leonablom.com',
  'Découvrir la boutique',
  'Explore the boutique',
  '/boutique',
  ''
);

-- 4) DB function to call edge function on new user signup
-- We use the existing handle_new_user trigger — we'll add a separate trigger
-- that calls net.http_post to invoke our edge function

-- Instead, we'll use a lightweight approach: the existing handle_new_user trigger 
-- inserts a row in user_emails_log, and the edge function is called from client-side
-- after signup. But better: we add to handle_new_user to insert the log row,
-- then use pg_net or a separate approach.

-- Simplest reliable approach: insert a pending row in user_emails_log from handle_new_user,
-- then have the edge function called via webhook or from the auth hook.
-- Let's add the insert to handle_new_user:

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  
  -- Create pending email log entry
  INSERT INTO public.user_emails_log (user_id, locale)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'locale', 'fr'))
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
