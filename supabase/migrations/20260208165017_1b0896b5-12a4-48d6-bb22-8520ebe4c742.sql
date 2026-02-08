
ALTER TABLE public.collections
ADD COLUMN featured_image_indexes integer[] NOT NULL DEFAULT '{0,1}'::integer[];
