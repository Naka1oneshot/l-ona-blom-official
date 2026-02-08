-- Add cover_focal_point to collections (top/center/bottom)
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS cover_focal_point text NOT NULL DEFAULT 'center';
