
-- Wishlist table: one row per user+product
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
ON public.wishlists FOR SELECT
USING (user_id = auth.uid());

-- Users can add to their own wishlist
CREATE POLICY "Users can add to own wishlist"
ON public.wishlists FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can remove from their own wishlist
CREATE POLICY "Users can delete own wishlist items"
ON public.wishlists FOR DELETE
USING (user_id = auth.uid());

-- Admins can view all wishlists
CREATE POLICY "Admins can manage wishlists"
ON public.wishlists FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
