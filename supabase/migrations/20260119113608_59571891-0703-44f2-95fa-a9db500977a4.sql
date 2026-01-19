-- Make avatars bucket private to protect user data
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

-- Create new policy that only allows authenticated users to view avatars
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');