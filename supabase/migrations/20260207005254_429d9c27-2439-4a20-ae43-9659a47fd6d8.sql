
-- Add rich content fields to posts table
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS lead_fr text DEFAULT '',
  ADD COLUMN IF NOT EXISTS lead_en text DEFAULT '',
  ADD COLUMN IF NOT EXISTS content_fr_json jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS content_en_json jsonb DEFAULT NULL;
