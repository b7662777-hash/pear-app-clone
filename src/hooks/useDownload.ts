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
      toast.info('Finding download source...', { duration: 3000 });
      
      // Smooth progress animation
      let progressValue = 0;
      const progressInterval = setInterval(() => {
        progressValue += Math.random() * 8 + 2;
        if (progressValue > 85) progressValue = 85;
        setDownloadProgress(progressValue);
      }, 150);

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

      // Handle successful URL response - download directly in browser
      if (data?.status === 'success' && data?.url) {
        setDownloadProgress(90);
        toast.success('Download starting!', { description: filename });
        
        // Create hidden iframe for download
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = data.url;
        document.body.appendChild(iframe);
        
        // Also try direct link click
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = data.url;
          link.download = filename;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.click();
        }, 500);
        
        // Cleanup iframe after delay
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 5000);
        
        setDownloadProgress(100);
        return;
      }

      // Handle fallback URLs - open cobalt.tools or other download page
      if (data?.status === 'fallback' && data?.urls?.length > 0) {
        setDownloadProgress(100);
        toast.info('Opening download page...', {
          description: 'Complete the download on the opened page',
          duration: 5000,
        });
        
        // Open cobalt.tools with pre-filled URL (best UX)
        window.open(data.urls[0], '_blank', 'noopener,noreferrer');
        return;
      }

      // Handle direct URL without status
      if (data?.url) {
        setDownloadProgress(90);
        window.open(data.url, '_blank', 'noopener,noreferrer');
        setDownloadProgress(100);
        toast.success('Download opened!');
        return;
      }

      throw new Error('No download URL received');
    } catch (error) {
      console.error('Download error:', error);
      
      // Fallback: open cobalt.tools directly
      toast.info('Opening cobalt.tools...', {
        description: 'Paste the song URL to download',
      });
      window.open(`https://cobalt.tools/#${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`, '_blank');
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
