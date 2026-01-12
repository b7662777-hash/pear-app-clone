import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DownloadOptions {
  videoId: string;
  title: string;
  artist: string;
}

export function useDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const downloadTrack = useCallback(async ({ videoId, title, artist }: DownloadOptions) => {
    if (!videoId) {
      toast.error('Cannot download this track');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    const filename = `${title} - ${artist}.mp3`.replace(/[<>:"/\\|?*]/g, '');

    try {
      toast.info('Preparing download...', { duration: 2000 });
      
      // Animate progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('youtube-download', {
        body: { videoId, title, artist },
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('Download function error:', error);
        throw new Error('Download service unavailable');
      }

      console.log('Download response:', data);

      // Handle successful URL response
      if (data?.status === 'success' && data?.url) {
        setDownloadProgress(95);
        toast.success('Download ready!', { description: 'Starting download...' });
        
        // Open the download URL in a new tab
        const link = document.createElement('a');
        link.href = data.url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloadProgress(100);
        return;
      }

      // Handle fallback URLs
      if (data?.status === 'fallback' && data?.urls?.length > 0) {
        setDownloadProgress(100);
        toast.info('Opening download page...', {
          description: 'Please complete the download on the opened page',
        });
        window.open(data.urls[0], '_blank', 'noopener,noreferrer');
        return;
      }

      // Handle direct URL
      if (data?.url) {
        setDownloadProgress(95);
        const link = document.createElement('a');
        link.href = data.url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloadProgress(100);
        toast.success('Download started!');
        return;
      }

      throw new Error('No download URL received');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed', {
        description: 'Please try again later',
      });
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
