
-- Create FAQ items table
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_fr TEXT NOT NULL,
  question_en TEXT,
  answer_fr TEXT NOT NULL,
  answer_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active items
CREATE POLICY "Anyone can view active FAQ items"
ON public.faq_items
FOR SELECT
USING (is_active OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage
CREATE POLICY "Admins can manage FAQ items"
ON public.faq_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamp
CREATE TRIGGER update_faq_items_updated_at
BEFORE UPDATE ON public.faq_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with existing data
INSERT INTO public.faq_items (question_fr, question_en, answer_fr, answer_en, sort_order) VALUES
('Quels sont les délais de confection ?', 'What are the crafting lead times?', 'Nos pièces sur commande sont confectionnées en 10 à 21 jours selon le modèle. Les pièces sur mesure peuvent nécessiter un délai supplémentaire.', 'Our made-to-order pieces are crafted in 10 to 21 days depending on the design. Made-to-measure pieces may require additional time.', 0),
('Comment prendre mes mesures ?', 'How do I take my measurements?', 'Un guide détaillé de prise de mesures est disponible sur chaque page produit sur mesure. N''hésitez pas à nous contacter pour une assistance personnalisée.', 'A detailed measurement guide is available on each made-to-measure product page. Feel free to contact us for personalized assistance.', 1),
('Quelles sont les options de livraison ?', 'What are the shipping options?', 'Nous livrons en Europe, au Royaume-Uni, aux États-Unis et au Canada. Les frais et délais varient selon votre zone géographique.', 'We ship to Europe, the UK, the US, and Canada. Fees and delivery times vary by region.', 2),
('Puis-je retourner une pièce sur mesure ?', 'Can I return a made-to-measure piece?', 'Les pièces sur mesure ne sont pas retournables sauf en cas de défaut de fabrication. Les pièces en stock peuvent être retournées sous 14 jours.', 'Made-to-measure pieces are non-returnable unless there is a manufacturing defect. In-stock pieces can be returned within 14 days.', 3),
('Quels modes de paiement acceptez-vous ?', 'What payment methods do you accept?', 'Nous acceptons les cartes bancaires (Visa, Mastercard, AMEX) via un paiement sécurisé Stripe, en EUR, USD, GBP et CAD.', 'We accept credit cards (Visa, Mastercard, AMEX) via secure Stripe payment, in EUR, USD, GBP, and CAD.', 4),
('Comment entretenir mes pièces ?', 'How do I care for my pieces?', 'Chaque pièce est accompagnée de ses instructions d''entretien spécifiques, visibles sur la fiche produit.', 'Each piece comes with specific care instructions, visible on the product page.', 5);
