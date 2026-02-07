
-- Add editorial_blocks_json column to products table
ALTER TABLE public.products ADD COLUMN editorial_blocks_json jsonb DEFAULT NULL;

COMMENT ON COLUMN public.products.editorial_blocks_json IS 'Array of editorial blocks for scrollytelling section. Each block: {id, title_fr, title_en, body_fr, body_en, image_index, style, alignment}';
