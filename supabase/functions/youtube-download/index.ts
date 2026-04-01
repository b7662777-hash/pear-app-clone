import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication helper
async function authenticate(req: Request): Promise<{ userId: string | null; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, error: 'Authentication required. Please sign in to download tracks.' };
  }
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error || !data?.user) {
      return { userId: null, error: 'Invalid or expired session. Please sign in again.' };
    }
    return { userId: data.user.id };
  } catch (e) {
    console.error('Auth error:', e);
    return { userId: null, error: 'Authentication failed' };
  }
}

// ── Piped instances (open-source YouTube proxy with audio streams) ──
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
  'https://api.piped.yt',
  'https://pipedapi.darkness.services',
];

// ── Invidious instances (another open-source YouTube frontend) ──
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks',
  'https://invidious.privacyredirect.com',
  'https://yt.cdaut.de',
];

// Try Piped API — returns direct audio stream URL
async function tryPiped(videoId: string): Promise<string | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      console.log(`Trying Piped: ${instance}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(`${instance}/streams/${videoId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        console.log(`Piped ${instance} returned ${resp.status}`);
        continue;
      }

      const data = await resp.json();

      // audioStreams is sorted; pick highest quality mp3/m4a/opus
      if (data.audioStreams && data.audioStreams.length > 0) {
        // Prefer higher bitrate; filter for audio-only
        const sorted = [...data.audioStreams].sort(
          (a: any, b: any) => (b.bitrate ?? 0) - (a.bitrate ?? 0)
        );
        const best = sorted[0];
        if (best?.url) {
          console.log(`Piped success via ${instance}, bitrate=${best.bitrate}`);
          return best.url;
        }
      }
    } catch (e) {
      console.log(`Piped ${instance} error:`, e);
    }
  }
  return null;
}

// Try Invidious API — returns direct audio stream URL
async function tryInvidious(videoId: string): Promise<string | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`Trying Invidious: ${instance}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        console.log(`Invidious ${instance} returned ${resp.status}`);
        continue;
      }

      const data = await resp.json();

      if (data.adaptiveFormats && data.adaptiveFormats.length > 0) {
        // Find audio-only formats
        const audioFormats = data.adaptiveFormats.filter(
          (f: any) => f.type?.startsWith('audio/')
        );
        if (audioFormats.length > 0) {
          // Sort by bitrate descending
          audioFormats.sort((a: any, b: any) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
          const best = audioFormats[0];
          if (best?.url) {
            console.log(`Invidious success via ${instance}, bitrate=${best.bitrate}`);
            return best.url;
          }
        }
      }
    } catch (e) {
      console.log(`Invidious ${instance} error:`, e);
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require auth
  const { userId, error: authError } = await authenticate(req);
  if (!userId) {
    return new Response(
      JSON.stringify({ error: authError, requiresAuth: true }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  console.log(`Download request from user: ${userId.slice(0, 8)}...`);

  try {
    const { videoId, title, artist } = await req.json();

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Video ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Download: ${videoId} - ${title} by ${artist}`);
    const filename = `${title || 'audio'} - ${artist || 'unknown'}.mp3`.replace(/[<>:"/\\|?*]/g, '');

    // Strategy 1: Piped
    let audioUrl = await tryPiped(videoId);

    // Strategy 2: Invidious
    if (!audioUrl) {
      audioUrl = await tryInvidious(videoId);
    }

    if (audioUrl) {
      return new Response(
        JSON.stringify({ status: 'success', url: audioUrl, filename }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // All strategies failed — return fallback links
    console.log('All download sources failed, returning fallbacks');
    return new Response(
      JSON.stringify({
        status: 'fallback',
        urls: [
          `https://ytapi.pro/?vid=${videoId}`,
          `https://ezmp3.to/?url=https://www.youtube.com/watch?v=${videoId}`,
        ],
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        filename,
        message: 'Direct download unavailable. Opening download page.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to process download request', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
