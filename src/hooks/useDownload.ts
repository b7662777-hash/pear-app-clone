import { useState } from 'react';
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

  const downloadTrack = async ({ videoId, title, artist }: DownloadOptions) => {
    if (!videoId) {
      toast.error('Cannot download this track');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      toast.info('Starting download...', { duration: 2000 });

      const { data, error } = await supabase.functions.invoke('youtube-download', {
        body: { videoId, title, artist },
      });

      if (error) {
        console.error('Download function error:', error);
        throw new Error('Download service unavailable');
      }

      if (!data || !data.url) {
        throw new Error('No download URL received');
      }

      console.log('Download response:', data);
      
      // Open download in new tab or trigger download
      const filename = data.filename || `${title} - ${artist}.mp3`;
      
      if (data.status === 'redirect' || data.status === 'stream') {
        // For redirect URLs, open in new tab
        const link = document.createElement('a');
        link.href = data.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Download started!', {
          description: `${title} - ${artist}`,
        });
      } else {
        // Try to fetch and download directly
        setDownloadProgress(10);
        
        const response = await fetch(data.url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch audio file');
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        const reader = response.body?.getReader();
        const chunks: ArrayBuffer[] = [];
        let receivedLength = 0;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            chunks.push(value.buffer as ArrayBuffer);
            receivedLength += value.length;
            
            if (total > 0) {
              setDownloadProgress(Math.round((receivedLength / total) * 100));
            }
          }
        }

        const blob = new Blob(chunks, { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Download complete!', {
          description: `${title} - ${artist}`,
        });
      }

      setDownloadProgress(100);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed', {
        description: 'Please try again later',
      });
    } finally {
      setIsDownloading(false);
      setTimeout(() => setDownloadProgress(0), 1000);
    }
  };

  return {
    downloadTrack,
    isDownloading,
    downloadProgress,
  };
}
