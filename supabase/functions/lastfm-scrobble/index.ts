import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LASTFM_API_KEY = Deno.env.get('LASTFM_API_KEY') || '';
const LASTFM_SHARED_SECRET = Deno.env.get('LASTFM_SHARED_SECRET') || '';
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

// Generate MD5 signature for Last.fm API
async function generateSignature(params: Record<string, string>): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  let signatureString = '';
  
  for (const key of sortedKeys) {
    if (key !== 'format' && key !== 'callback') {
      signatureString += key + params[key];
    }
  }
  signatureString += LASTFM_SHARED_SECRET;

  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Make signed API call to Last.fm
async function lastfmApiCall(method: string, params: Record<string, string>, httpMethod = 'POST'): Promise<any> {
  const allParams: Record<string, string> = {
    ...params,
    method,
    api_key: LASTFM_API_KEY,
    format: 'json',
  };

  const api_sig = await generateSignature(allParams);
  allParams.api_sig = api_sig;

  if (httpMethod === 'POST') {
    const body = new URLSearchParams(allParams);
    const response = await fetch(LASTFM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    return response.json();
  } else {
    const url = new URL(LASTFM_API_URL);
    Object.entries(allParams).forEach(([key, value]) => url.searchParams.append(key, value));
    const response = await fetch(url.toString());
    return response.json();
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API keys are configured
    if (!LASTFM_API_KEY || !LASTFM_SHARED_SECRET) {
      console.warn('[Last.fm] API keys not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Last.fm API keys not configured',
          message: 'Add LASTFM_API_KEY and LASTFM_SHARED_SECRET to your backend secrets'
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { action, ...params } = await req.json();
    console.log(`[Last.fm] Action: ${action}`);

    switch (action) {
      case 'getAuthUrl': {
        const callbackUrl = params.callbackUrl || `${req.headers.get('origin')}/settings`;
        const authUrl = `https://www.last.fm/api/auth/?api_key=${LASTFM_API_KEY}&cb=${encodeURIComponent(callbackUrl)}`;
        
        return new Response(
          JSON.stringify({ url: authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'getSession': {
        const { token } = params;
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Token required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const result = await lastfmApiCall('auth.getSession', { token });
        
        if (result.error) {
          console.error('[Last.fm] Session error:', result.message);
          return new Response(
            JSON.stringify({ error: result.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ session: result.session }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'nowPlaying': {
        const { sessionKey, track } = params;
        if (!sessionKey || !track) {
          return new Response(
            JSON.stringify({ error: 'Session key and track required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const nowPlayingParams: Record<string, string> = {
          sk: sessionKey,
          artist: track.artist,
          track: track.title,
        };

        if (track.album) nowPlayingParams.album = track.album;
        if (track.duration) nowPlayingParams.duration = String(Math.floor(track.duration));

        const result = await lastfmApiCall('track.updateNowPlaying', nowPlayingParams);
        
        if (result.error) {
          console.error('[Last.fm] Now Playing error:', result.message);
          return new Response(
            JSON.stringify({ error: result.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[Last.fm] Now Playing updated:', track.title);
        return new Response(
          JSON.stringify({ success: true, nowplaying: result.nowplaying }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'scrobble': {
        const { sessionKey, track } = params;
        if (!sessionKey || !track) {
          return new Response(
            JSON.stringify({ error: 'Session key and track required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const scrobbleParams: Record<string, string> = {
          sk: sessionKey,
          artist: track.artist,
          track: track.title,
          timestamp: String(track.timestamp || Math.floor(Date.now() / 1000)),
        };

        if (track.album) scrobbleParams.album = track.album;
        if (track.duration) scrobbleParams.duration = String(Math.floor(track.duration));

        const result = await lastfmApiCall('track.scrobble', scrobbleParams);
        
        if (result.error) {
          console.error('[Last.fm] Scrobble error:', result.message);
          return new Response(
            JSON.stringify({ error: result.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[Last.fm] Scrobbled:', track.title);
        return new Response(
          JSON.stringify({ success: true, scrobbles: result.scrobbles }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[Last.fm] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
