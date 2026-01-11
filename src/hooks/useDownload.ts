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

    const filename = `${title} - ${artist}.mp3`.replace(/[<>:"/\\|?*]/g, '');

    try {
      toast.info('Preparing download...', { duration: 3000 });
      setDownloadProgress(10);

      const { data, error } = await supabase.functions.invoke('youtube-download', {
        body: { videoId, title, artist },
      });

      if (error) {
        console.error('Download function error:', error);
        throw new Error('Download service unavailable');
      }

      setDownloadProgress(50);

      // Check if we received binary audio data (ArrayBuffer)
      if (data instanceof ArrayBuffer) {
        setDownloadProgress(90);
        
        // Create blob from the audio data
        const blob = new Blob([data], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        setDownloadProgress(100);
        toast.success('Download complete!', {
          description: filename,
        });
        return;
      }

      // Handle JSON response (fallback URLs)
      if (data && typeof data === 'object') {
        if (data.status === 'fallback') {
          // Try the fallback URLs array first
          if (data.urls && Array.isArray(data.urls)) {
            toast.info('Opening download page...', {
              description: 'Please complete download on the external site',
            });
            
            // Open the first fallback URL
            window.open(data.urls[0], '_blank', 'noopener,noreferrer');
            setDownloadProgress(100);
            return;
          }
          
          // Legacy single URL fallback
          if (data.url) {
            toast.info('Opening download page...', {
              description: 'Please complete download on the external site',
            });
            
            window.open(data.url, '_blank', 'noopener,noreferrer');
            setDownloadProgress(100);
            return;
          }
        }

        if (data.url) {
          // Try to fetch the URL directly
          setDownloadProgress(60);
          
          try {
            const response = await fetch(data.url, {
              mode: 'cors',
            });
            
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              
              if (contentType?.includes('audio') || contentType?.includes('octet-stream')) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                
                setDownloadProgress(100);
                toast.success('Download complete!', {
                  description: filename,
                });
                return;
              }
            }
          } catch (fetchError) {
            console.log('Direct fetch failed, opening URL in new tab');
          }
          
          // Fallback: open in new tab
          window.open(data.url, '_blank', 'noopener,noreferrer');
          setDownloadProgress(100);
          toast.info('Download opened in new tab', {
            description: 'Please save the file from the opened page',
          });
          return;
        }
      }

      throw new Error('No download URL received');
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
