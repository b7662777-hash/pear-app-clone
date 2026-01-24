import { useEffect, useRef, useCallback, useState } from 'react';
import { Track } from '@/contexts/PlayerContext';
import { supabase } from '@/integrations/supabase/client';

interface UseLastFmScrobbleOptions {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface LastFmSettings {
  enabled: boolean;
  sessionKey: string | null;
  username: string | null;
}

export function useLastFmScrobble({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
}: UseLastFmScrobbleOptions) {
  const [settings, setSettings] = useState<LastFmSettings>(() => {
    const stored = localStorage.getItem('lastfm_settings');
    return stored ? JSON.parse(stored) : { enabled: false, sessionKey: null, username: null };
  });
  
  const nowPlayingSentRef = useRef<string | null>(null);
  const scrobbledRef = useRef<string | null>(null);
  const trackStartTimeRef = useRef<number>(0);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('lastfm_settings', JSON.stringify(settings));
  }, [settings]);

  // Reset tracking when track changes
  useEffect(() => {
    if (currentTrack) {
      const trackKey = `${currentTrack.videoId || currentTrack.id}`;
      if (nowPlayingSentRef.current !== trackKey) {
        nowPlayingSentRef.current = null;
        scrobbledRef.current = null;
        trackStartTimeRef.current = Date.now();
      }
    }
  }, [currentTrack?.id, currentTrack?.videoId]);

  // Send Now Playing update
  useEffect(() => {
    if (!settings.enabled || !settings.sessionKey || !currentTrack || !isPlaying) return;
    
    const trackKey = `${currentTrack.videoId || currentTrack.id}`;
    if (nowPlayingSentRef.current === trackKey) return;

    const sendNowPlaying = async () => {
      try {
        await supabase.functions.invoke('lastfm-scrobble', {
          body: {
            action: 'nowPlaying',
            sessionKey: settings.sessionKey,
            track: {
              artist: currentTrack.artist,
              title: currentTrack.title,
              album: currentTrack.album,
              duration: currentTrack.duration,
            },
          },
        });
        nowPlayingSentRef.current = trackKey;
        console.log('[Last.fm] Now Playing sent:', currentTrack.title);
      } catch (error) {
        console.error('[Last.fm] Failed to send Now Playing:', error);
      }
    };

    sendNowPlaying();
  }, [currentTrack, isPlaying, settings.enabled, settings.sessionKey]);

  // Send Scrobble when track is >50% played or >4 minutes played
  useEffect(() => {
    if (!settings.enabled || !settings.sessionKey || !currentTrack || !isPlaying) return;
    if (duration <= 0) return;

    const trackKey = `${currentTrack.videoId || currentTrack.id}`;
    if (scrobbledRef.current === trackKey) return;

    const playedPercentage = (currentTime / duration) * 100;
    const playedSeconds = currentTime;
    const minPlayTime = Math.min(240, duration / 2); // 4 minutes or half the track

    // Scrobble if played >50% or >4 minutes (Last.fm rules)
    if (playedPercentage >= 50 || playedSeconds >= minPlayTime) {
      const sendScrobble = async () => {
        try {
          await supabase.functions.invoke('lastfm-scrobble', {
            body: {
              action: 'scrobble',
              sessionKey: settings.sessionKey,
              track: {
                artist: currentTrack.artist,
                title: currentTrack.title,
                album: currentTrack.album,
                duration: currentTrack.duration,
                timestamp: Math.floor(trackStartTimeRef.current / 1000),
              },
            },
          });
          scrobbledRef.current = trackKey;
          console.log('[Last.fm] Scrobbled:', currentTrack.title);
        } catch (error) {
          console.error('[Last.fm] Failed to scrobble:', error);
        }
      };

      sendScrobble();
    }
  }, [currentTrack, isPlaying, currentTime, duration, settings.enabled, settings.sessionKey]);

  const updateSettings = useCallback((newSettings: Partial<LastFmSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const connect = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('lastfm-scrobble', {
        body: { action: 'getAuthUrl' },
      });
      
      if (error) throw error;
      if (data?.url) {
        // Open Last.fm auth in popup
        window.open(data.url, 'lastfm_auth', 'width=800,height=600');
      }
    } catch (error) {
      console.error('[Last.fm] Failed to get auth URL:', error);
    }
  }, []);

  const handleCallback = useCallback(async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('lastfm-scrobble', {
        body: { action: 'getSession', token },
      });
      
      if (error) throw error;
      if (data?.session) {
        updateSettings({
          enabled: true,
          sessionKey: data.session.key,
          username: data.session.name,
        });
        return true;
      }
    } catch (error) {
      console.error('[Last.fm] Failed to get session:', error);
    }
    return false;
  }, [updateSettings]);

  const disconnect = useCallback(() => {
    updateSettings({ enabled: false, sessionKey: null, username: null });
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    connect,
    handleCallback,
    disconnect,
  };
}
