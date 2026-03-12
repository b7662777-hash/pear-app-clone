
CREATE TABLE public.downloaded_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  thumbnail TEXT,
  duration TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.downloaded_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own downloads" ON public.downloaded_songs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads" ON public.downloaded_songs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own downloads" ON public.downloaded_songs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
