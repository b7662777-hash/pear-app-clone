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
      toast.info('Preparing download...', { duration: 2000 });
      setDownloadProgress(5);

      const safeFilename = filename || 'download.mp3';

      const saveBlob = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = safeFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      };

      const handleFallbackJson = (payload: any) => {
        if (payload?.status === 'fallback') {
          const urls: string[] = Array.isArray(payload.urls)
            ? payload.urls
            : payload.url
              ? [payload.url]
              : [];

          if (urls.length) {
            toast.info('Opening download page...', {
              description: 'Direct MP3 not available — using fallback link',
            });
            window.open(urls[0], '_blank', 'noopener,noreferrer');
            setDownloadProgress(100);
            return true;
          }
        }

        if (payload?.url && typeof payload.url === 'string') {
          window.open(payload.url, '_blank', 'noopener,noreferrer');
          setDownloadProgress(100);
          toast.info('Download opened in new tab', {
            description: 'Please save the file from the opened page',
          });
          return true;
        }

        return false;
      };

      // 1) Preferred path: direct fetch to stream progress in the UI
      const supabaseUrl = (supabase as any)?.supabaseUrl as string | undefined;
      const supabaseKey = (supabase as any)?.supabaseKey as string | undefined;

      if (supabaseUrl && supabaseKey) {
        setDownloadProgress(10);

        const res = await fetch(`${supabaseUrl}/functions/v1/youtube-download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ videoId, title, artist }),
        });

        const contentType = res.headers.get('content-type') || '';

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.error('Download fetch error:', res.status, text);
          throw new Error('Download service unavailable');
        }

        // JSON fallback from backend
        if (contentType.includes('application/json')) {
          const json = await res.json().catch(() => null);
          if (handleFallbackJson(json)) return;
          throw new Error('No download URL received');
        }

        // Audio/binary stream
        const total = Number(res.headers.get('content-length') || 0);

        // Some environments may not expose a stream
        if (!res.body) {
          setDownloadProgress(90);
          const blob = await res.blob();
          saveBlob(blob);
          setDownloadProgress(100);
          toast.success('Download complete!', { description: safeFilename });
          return;
        }

        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          chunks.push(value);
          received += value.length;

          if (total > 0) {
            const pct = Math.min(99, Math.max(10, Math.round((received / total) * 100)));
            setDownloadProgress(pct);
          } else {
            // No content-length → keep it moving
            setDownloadProgress((p) => (p < 95 ? p + 1 : p));
          }
        }

        const blobParts: Uint8Array[] = [];
        for (const c of chunks) {
          const copy = new Uint8Array(c.byteLength);
          copy.set(c);
          blobParts.push(copy);
        }
        const blob = new Blob(blobParts as unknown as BlobPart[], { type: 'audio/mpeg' });
        saveBlob(blob);

        setDownloadProgress(100);
        toast.success('Download complete!', { description: safeFilename });
        return;
      }

      // 2) Fallback: invoke (may return Blob/ArrayBuffer/JSON)
      setDownloadProgress(15);
      const { data, error } = await supabase.functions.invoke('youtube-download', {
        body: { videoId, title, artist },
      });

      if (error) {
        console.error('Download function error:', error);
        throw new Error('Download service unavailable');
      }

      // Supabase client typically returns a Blob for non-JSON responses
      if (data instanceof Blob) {
        setDownloadProgress(90);
        saveBlob(data);
        setDownloadProgress(100);
        toast.success('Download complete!', { description: safeFilename });
        return;
      }

      if (data instanceof ArrayBuffer) {
        setDownloadProgress(90);
        const blob = new Blob([data], { type: 'audio/mpeg' });
        saveBlob(blob);
        setDownloadProgress(100);
        toast.success('Download complete!', { description: safeFilename });
        return;
      }

      if (data && typeof data === 'object') {
        if (handleFallbackJson(data)) return;
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
