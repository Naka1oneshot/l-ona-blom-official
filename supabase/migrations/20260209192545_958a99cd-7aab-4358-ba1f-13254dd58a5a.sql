
-- Create admin tasks table
CREATE TABLE public.admin_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

-- Only admins can CRUD
CREATE POLICY "Admins can view all tasks"
  ON public.admin_tasks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create tasks"
  ON public.admin_tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tasks"
  ON public.admin_tasks FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tasks"
  ON public.admin_tasks FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_admin_tasks_updated_at
  BEFORE UPDATE ON public.admin_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
