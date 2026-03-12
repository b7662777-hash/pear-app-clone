import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const [downloadedSongs, setDownloadedSongs] = useState<DownloadedSong[]>([]);

  // Fetch user's downloaded songs
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

  // Save download record to DB
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

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Sign in required', {
        description: 'Please sign in to download tracks',
        action: {
          label: 'Sign In',
          onClick: () => navigate('/auth'),
        },
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    const filename = `${title} - ${artist}.mp3`.replace(/[<>:"/\\|?*]/g, '');

    try {
      toast.info('Finding download source...', { duration: 3000 });
      
      // Smooth progress animation
      let progressValue = 0;
      const progressInterval = setInterval(() => {
        progressValue += Math.random() * 10 + 3;
        if (progressValue > 85) progressValue = 85;
        setDownloadProgress(Math.round(progressValue));
      }, 200);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('youtube-download', {
        body: { videoId, title, artist },
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('Download function error:', error);
        // Check if it's an auth error
        if (error.message?.includes('401') || error.message?.includes('auth')) {
          toast.error('Session expired', {
            description: 'Please sign in again to download',
            action: {
              label: 'Sign In',
              onClick: () => navigate('/auth'),
            },
          });
          return;
        }
        throw new Error('Download service unavailable');
      }

      // Check for auth requirement in response
      if (data?.requiresAuth) {
        toast.error('Sign in required', {
          description: data.error || 'Please sign in to download tracks',
          action: {
            label: 'Sign In',
            onClick: () => navigate('/auth'),
          },
        });
        return;
      }

      console.log('Download response:', data);

      // Handle successful URL response
      if (data?.status === 'success' && data?.url) {
        setDownloadProgress(90);
        
        // Try to download directly
        try {
          toast.loading('Downloading...', { id: 'download-progress' });
          
          const response = await fetch(data.url);
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = data.filename || filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setDownloadProgress(100);
            toast.success('Download complete!', { id: 'download-progress' });
            await saveDownloadRecord({ videoId, title, artist, album, thumbnail, duration });
            return;
          }
        } catch (fetchError) {
          console.log('Direct fetch failed, trying redirect:', fetchError);
        }
        
        // Fallback: Open URL directly (will trigger browser download)
        window.open(data.url, '_blank', 'noopener,noreferrer');
        setDownloadProgress(100);
        toast.success('Download started!', { id: 'download-progress', description: 'Check your downloads folder' });
        return;
      }

      // Handle fallback URLs
      if (data?.status === 'fallback' && data?.urls?.length > 0) {
        setDownloadProgress(100);
        
        // Copy YouTube URL to clipboard for easy pasting
        if (data.youtubeUrl) {
          try {
            await navigator.clipboard.writeText(data.youtubeUrl);
            toast.info('Opening download page...', {
              description: 'YouTube URL copied! Paste it on the download site.',
              duration: 6000,
            });
          } catch {
            toast.info('Opening download page...', {
              description: 'Paste the YouTube URL to download',
              duration: 5000,
            });
          }
        }
        
        // Open cobalt.tools (best UX)
        window.open(data.urls[0], '_blank', 'noopener,noreferrer');
        return;
      }

      throw new Error('No download URL received');
    } catch (error) {
      console.error('Download error:', error);
      
      // Fallback: open cobalt.tools directly
      toast.info('Opening cobalt.tools...', {
        description: 'Paste the song URL to download',
      });
      
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      try {
        await navigator.clipboard.writeText(youtubeUrl);
      } catch {}
      
      window.open('https://cobalt.tools', '_blank');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDownloadProgress(0), 1500);
    }
  }, []);

  return {
    downloadTrack,
    isDownloading,
    downloadProgress,
  };
}
