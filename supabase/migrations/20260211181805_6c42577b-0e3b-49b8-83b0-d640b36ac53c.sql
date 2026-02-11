-- Create storage bucket for try-on test images
INSERT INTO storage.buckets (id, name, public) VALUES ('tryon-assets', 'tryon-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
CREATE POLICY "Public can read tryon assets" ON storage.objects FOR SELECT USING (bucket_id = 'tryon-assets');

-- Allow authenticated upload
CREATE POLICY "Auth users can upload tryon assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tryon-assets');
