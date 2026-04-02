import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DownloadOptions {
  videoId: string;
  title: string;
  artist: string;
  album?: string;
  thumbnail?: string;
  duration?: string;
}

export interface DownloadedSong {
  id: string;
  user_id: string;
  video_id: string;
  title: string;
  artist: string;
  album: string | null;
  thumbnail: string | null;
  duration: string | null;
  downloaded_at: string;
}

export function useDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedSongs, setDownloadedSongs] = useState<DownloadedSong[]>([]);

  const navigateToAuth = () => { window.location.href = '/auth'; };

  const fetchDownloads = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('downloaded_songs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('downloaded_at', { ascending: false });
    if (data) setDownloadedSongs(data);
  }, []);

  useEffect(() => {
    fetchDownloads();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => fetchDownloads());
    return () => subscription.unsubscribe();
  }, [fetchDownloads]);

  const saveDownloadRecord = useCallback(async (options: DownloadOptions) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('downloaded_songs').upsert({
      user_id: session.user.id,
      video_id: options.videoId,
      title: options.title,
      artist: options.artist,
      album: options.album || null,
      thumbnail: options.thumbnail || null,
      duration: options.duration || null,
    }, { onConflict: 'user_id,video_id' });
    fetchDownloads();
  }, [fetchDownloads]);

  const downloadTrack = useCallback(async ({ videoId, title, artist, album, thumbnail, duration }: DownloadOptions) => {
    if (!videoId) {
      toast.error('Cannot download this track');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Sign in required', {
        description: 'Please sign in to download tracks',
        action: { label: 'Sign In', onClick: navigateToAuth },
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // Copy URL to clipboard
      try {
        await navigator.clipboard.writeText(ytUrl);
      } catch {}

      // Open ytmp3.cc with the YouTube URL auto-filled
      const ytmp3Url = `https://ytmp3.cc/en/?url=${encodeURIComponent(ytUrl)}`;
      window.open(ytmp3Url, '_blank', 'noopener,noreferrer');

      setDownloadProgress(100);
      toast.success('Download page opened!', {
        description: `YouTube URL copied to clipboard. Converting "${title}" to MP3...`,
        duration: 5000,
      });

      // Save to download history
      await saveDownloadRecord({ videoId, title, artist, album, thumbnail, duration });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to open download page');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDownloadProgress(0), 1500);
    }
  }, [saveDownloadRecord]);

  return { downloadTrack, isDownloading, downloadProgress, downloadedSongs, fetchDownloads };
}
