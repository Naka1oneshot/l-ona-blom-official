
-- Fix the permissive newsletter INSERT policy by being explicit about roles
DROP POLICY "Anyone can subscribe" ON public.newsletter_subscribers;

-- Separate policies for anon and authenticated
CREATE POLICY "Anon can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT TO authenticated
  WITH CHECK (true);
