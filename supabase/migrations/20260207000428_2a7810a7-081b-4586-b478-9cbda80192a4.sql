
ALTER TABLE public.posts ADD COLUMN category text NOT NULL DEFAULT 'article';

-- Add an event_date column for events scheduling
ALTER TABLE public.posts ADD COLUMN event_date timestamp with time zone DEFAULT NULL;
