
-- Add reference_code to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reference_code text UNIQUE;

-- Add reference_code to collections
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS reference_code text UNIQUE;

-- Create import_runs table for import history
CREATE TABLE public.import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('products', 'collections')),
  filename text NOT NULL,
  user_id uuid NOT NULL,
  stats_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  report_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage import_runs"
ON public.import_runs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
