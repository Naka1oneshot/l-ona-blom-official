
-- Table for contact form submissions
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  locale text DEFAULT 'fr',
  status text NOT NULL DEFAULT 'new',
  consent boolean NOT NULL DEFAULT false
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a contact message
CREATE POLICY "Anyone can submit contact message"
ON public.contact_messages FOR INSERT
WITH CHECK (true);

-- Only admins can read/manage messages
CREATE POLICY "Admins can manage contact messages"
ON public.contact_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed the contact page content
INSERT INTO public.site_settings (key, value) VALUES (
  'page_contact',
  '{
    "hero": {
      "image_url": "",
      "title_fr": "Contact",
      "title_en": "Contact",
      "subtitle_fr": "Nous serions ravis d''échanger avec vous.",
      "subtitle_en": "We would love to hear from you."
    },
    "coordinates": {
      "email": "contact@leonablom.com",
      "phone": "",
      "address_fr": "",
      "address_en": "",
      "hours_fr": "",
      "hours_en": ""
    },
    "press": {
      "text_fr": "",
      "text_en": "",
      "email": ""
    },
    "socials": [
      {"key": "instagram", "label": "Instagram", "url": "https://www.instagram.com/leona_blom.dsgn/", "enabled": true, "order": 1},
      {"key": "tiktok", "label": "TikTok", "url": "https://www.tiktok.com/@leona.blom", "enabled": true, "order": 2},
      {"key": "pinterest", "label": "Pinterest", "url": "https://pinterest.com/leonablom", "enabled": true, "order": 3},
      {"key": "youtube", "label": "YouTube", "url": "https://www.youtube.com/@LéonaBLOM", "enabled": true, "order": 4},
      {"key": "facebook", "label": "Facebook", "url": "https://www.facebook.com/profile.php?id=61573449504492", "enabled": true, "order": 5},
      {"key": "linkedin", "label": "LinkedIn", "url": "https://www.linkedin.com/in/léona-blom-716618382/", "enabled": true, "order": 6}
    ],
    "form": {
      "enabled": true,
      "title_fr": "Écrivez-nous",
      "title_en": "Write to us",
      "consent_fr": "J''accepte que mes données soient utilisées pour répondre à ma demande.",
      "consent_en": "I agree that my data may be used to respond to my inquiry."
    },
    "atelier": {
      "title_fr": "",
      "title_en": "",
      "text_fr": "",
      "text_en": "",
      "image_url": ""
    }
  }'::jsonb
) ON CONFLICT DO NOTHING;
