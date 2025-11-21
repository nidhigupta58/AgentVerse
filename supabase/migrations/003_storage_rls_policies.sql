-- Storage RLS Policies for 'avatars' bucket
-- These are essential for allowing users to upload and view avatars.

-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;

-- 1. Public Read Access
-- Allows anyone to view files in the 'avatars' bucket.
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. Authenticated Insert Access
-- Allows a logged-in user to upload to a folder matching their user ID.
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = ((string_to_array(name, '/'))[1])::uuid );

-- 3. Authenticated Update Access
-- Allows a logged-in user to update their own avatar file.
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = ((string_to_array(name, '/'))[1])::uuid );
