import { useEffect, useRef, useState, useCallback } from 'react';
import { Track } from '@/contexts/PlayerContext';
import { supabase } from '@/integrations/supabase/client';

interface UseDiscordPresenceOptions {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface DiscordSettings {
  enabled: boolean;
  webhookUrl: string | null;
  lastUpdated: number | null;
}

export function useDiscordPresence({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
}: UseDiscordPresenceOptions) {
  const [settings, setSettings] = useState<DiscordSettings>(() => {
    const stored = localStorage.getItem('discord_settings');
    return stored ? JSON.parse(stored) : { enabled: false, webhookUrl: null, lastUpdated: null };
  });
  
  const lastSentTrackRef = useRef<string | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('discord_settings', JSON.stringify(settings));
  }, [settings]);

  // Send presence update via webhook
  const sendPresenceUpdate = useCallback(async (track: Track, playing: boolean) => {
    if (!settings.enabled || !settings.webhookUrl) return;

    try {
      const response = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: playing ? '🎵 Now Playing' : '⏸️ Paused',
            description: `**${track.title}**\nby ${track.artist}`,
            thumbnail: { url: track.image },
            color: playing ? 0x1DB954 : 0x666666,
            footer: { text: track.album || 'Unknown Album' },
            timestamp: new Date().toISOString(),
          }],
        }),
      });

      if (!response.ok) {
        console.error('[Discord] Webhook failed:', response.status);
      } else {
        console.log('[Discord] Presence updated:', track.title);
      }
    } catch (error) {
      console.error('[Discord] Failed to send presence:', error);
    }
  }, [settings.enabled, settings.webhookUrl]);

  // Update presence when track or play state changes
  useEffect(() => {
    if (!settings.enabled || !currentTrack) return;

    const trackKey = `${currentTrack.videoId || currentTrack.id}-${isPlaying}`;
    
    // Only send update if track or play state changed
    if (lastSentTrackRef.current !== trackKey) {
      lastSentTrackRef.current = trackKey;
      sendPresenceUpdate(currentTrack, isPlaying);
    }
  }, [currentTrack, isPlaying, settings.enabled, sendPresenceUpdate]);

  // Clear presence when playback stops
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<DiscordSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const testWebhook = useCallback(async (webhookUrl: string) => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '✅ Webhook Connected!',
            description: 'Your Discord webhook is working. Music updates will appear here.',
            color: 0x1DB954,
            timestamp: new Date().toISOString(),
          }],
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('[Discord] Webhook test failed:', error);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    updateSettings({ enabled: false, webhookUrl: null });
    lastSentTrackRef.current = null;
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    testWebhook,
    disconnect,
  };
}
