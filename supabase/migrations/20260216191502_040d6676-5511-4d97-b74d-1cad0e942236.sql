
-- Allow authenticated users to validate active promo codes
CREATE POLICY "Users can validate active promo codes"
ON public.promo_codes
FOR SELECT TO authenticated
USING (
  active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at > now())
  AND (max_redemptions IS NULL OR times_redeemed < max_redemptions)
);

-- Tighten tryon-assets upload policy: require auth, user folder, image types only
DROP POLICY IF EXISTS "Auth users can upload tryon assets" ON storage.objects;

CREATE POLICY "Authenticated image uploads to tryon-assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tryon-assets'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);
