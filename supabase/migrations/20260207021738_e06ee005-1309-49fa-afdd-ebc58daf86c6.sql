
-- Create category_groups table
CREATE TABLE public.category_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active groups" ON public.category_groups
  FOR SELECT USING (is_active OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage groups" ON public.category_groups
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT,
  group_id UUID NOT NULL REFERENCES public.category_groups(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add category_id to products (nullable FK with ON DELETE SET NULL)
ALTER TABLE public.products
  ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_categories_group_id ON public.categories(group_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_category_groups_slug ON public.category_groups(slug);
CREATE INDEX idx_products_category_id ON public.products(category_id);

-- Seed default groups
INSERT INTO public.category_groups (slug, name_fr, sort_order) VALUES
  ('tresors-a-porter', 'Trésors à porter', 0),
  ('accessoires', 'Accessoires', 1);

-- Seed default categories
INSERT INTO public.categories (slug, name_fr, group_id, sort_order) VALUES
  ('robes', 'Robes', (SELECT id FROM public.category_groups WHERE slug = 'tresors-a-porter'), 0),
  ('jupes', 'Jupes', (SELECT id FROM public.category_groups WHERE slug = 'tresors-a-porter'), 1),
  ('pantalons', 'Pantalons', (SELECT id FROM public.category_groups WHERE slug = 'tresors-a-porter'), 2),
  ('vestes', 'Vestes', (SELECT id FROM public.category_groups WHERE slug = 'tresors-a-porter'), 3),
  ('hauts', 'Hauts', (SELECT id FROM public.category_groups WHERE slug = 'tresors-a-porter'), 4),
  ('cravates', 'Cravates', (SELECT id FROM public.category_groups WHERE slug = 'accessoires'), 0);

-- Map existing products: match products.category string to categories.slug
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE lower(p.category) = c.slug;

-- Also map common english names to french slugs
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'robes') WHERE category_id IS NULL AND lower(category) IN ('dresses', 'dress');
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'hauts') WHERE category_id IS NULL AND lower(category) IN ('tops', 'top');
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'jupes') WHERE category_id IS NULL AND lower(category) IN ('skirts', 'skirt');
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'pantalons') WHERE category_id IS NULL AND lower(category) IN ('pants', 'pant');
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'vestes') WHERE category_id IS NULL AND lower(category) IN ('sets', 'set', 'jackets', 'jacket');
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'cravates') WHERE category_id IS NULL AND lower(category) IN ('accessories', 'accessory', 'ties', 'tie');
