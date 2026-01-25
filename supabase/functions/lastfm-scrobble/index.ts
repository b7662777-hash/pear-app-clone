import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LASTFM_API_KEY = Deno.env.get('LASTFM_API_KEY') || '';
const LASTFM_SHARED_SECRET = Deno.env.get('LASTFM_SHARED_SECRET') || '';
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max requests per window
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);
  
  // Clean up periodically
  if (rateLimitStore.size > 100) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }
  
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetIn: entry.resetTime - now };
}

// Strict authentication helper
async function authenticate(req: Request): Promise<{ userId: string; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: '', error: 'Authentication required. Please log in to use this feature.' };
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabaseClient.auth.getClaims(token);
    
    if (error || !data?.claims) {
      console.log('[Last.fm] Auth token invalid');
      return { userId: '', error: 'Invalid or expired token. Please log in again.' };
    }

    return { userId: data.claims.sub as string };
  } catch (e) {
    console.error('[Last.fm] Authentication error:', e);
    return { userId: '', error: 'Authentication failed. Please try again.' };
  }
}

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

  // Require authentication
  const { userId, error: authError } = await authenticate(req);
  if (authError || !userId) {
    console.log('[Last.fm] Unauthenticated request rejected');
    return new Response(
      JSON.stringify({ 
        error: authError || 'Authentication required',
        requiresAuth: true,
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[Last.fm] Authenticated request from user: ${userId.slice(0, 8)}...`);

  // Apply rate limiting
  const rateLimit = checkRateLimit(userId);
  const rateLimitHeaders = {
    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
  };
  
  if (!rateLimit.allowed) {
    console.warn(`[Last.fm] Rate limit exceeded for user: ${userId.slice(0, 8)}...`);
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          ...rateLimitHeaders,
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(),
        } 
      }
    );
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
          headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' }
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
          { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'getSession': {
        const { token } = params;
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Token required' }),
            { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const result = await lastfmApiCall('auth.getSession', { token });
        
        if (result.error) {
          console.error('[Last.fm] Session error:', result.message);
          return new Response(
            JSON.stringify({ error: result.message }),
            { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ session: result.session }),
          { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'nowPlaying': {
        const { sessionKey, track } = params;
        if (!sessionKey || !track) {
          return new Response(
            JSON.stringify({ error: 'Session key and track required' }),
            { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
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
            { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[Last.fm] Now Playing updated:', track.title);
        return new Response(
          JSON.stringify({ success: true, nowplaying: result.nowplaying }),
          { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'scrobble': {
        const { sessionKey, track } = params;
        if (!sessionKey || !track) {
          return new Response(
            JSON.stringify({ error: 'Session key and track required' }),
            { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
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
            { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[Last.fm] Scrobbled:', track.title);
        return new Response(
          JSON.stringify({ success: true, scrobbles: result.scrobbles }),
          { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    // Log detailed error server-side only
    const errorId = crypto.randomUUID().slice(0, 8);
    console.error(`[Last.fm] [${errorId}] Error:`, error);
    
    return new Response(
      JSON.stringify({ error: 'An error occurred', errorId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
