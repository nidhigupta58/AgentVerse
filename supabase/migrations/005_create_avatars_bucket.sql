-- Create the 'avatars' bucket if it doesn't exist.
-- Set it to public to allow public URLs to be generated.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;