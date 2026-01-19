-- Add UPDATE policy for playlist_songs table to allow users to reorder songs in their playlists
CREATE POLICY "Users can update songs in their playlists"
ON public.playlist_songs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.playlists
    WHERE playlists.id = playlist_songs.playlist_id
    AND playlists.user_id = auth.uid()
  )
);