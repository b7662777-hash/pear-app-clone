import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get client IP from request headers
function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  let hash = 0;
  const str = userAgent + acceptLanguage;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `fingerprint-${Math.abs(hash).toString(36)}`;
}

// Optional authentication helper - allows unauthenticated access with IP-based rate limiting
async function tryAuthenticate(req: Request): Promise<{ userId: string | null; identifier: string }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, identifier: getClientIp(req) };
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
      return { userId: null, identifier: getClientIp(req) };
    }

    return { userId: data.claims.sub as string, identifier: data.claims.sub as string };
  } catch (e) {
    return { userId: null, identifier: getClientIp(req) };
  }
}

// List of public cobalt instances
const COBALT_INSTANCES = [
  'https://cobalt.api.kityune.moe',
  'https://api.cobalt.tools',
  'https://co.wuk.sh',
];

// Try multiple cobalt instances with the new API format
const getDownloadUrl = async (videoId: string): Promise<{ url: string; filename?: string } | null> => {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  for (const instance of COBALT_INSTANCES) {
    try {
      console.log(`Trying cobalt instance: ${instance}`);
      
      const response = await fetch(instance, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl,
          downloadMode: "audio",
          audioFormat: "mp3",
          audioBitrate: "128",
          filenameStyle: "pretty",
        }),
      });
      
      if (!response.ok) {
        console.log(`${instance} returned status ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`${instance} response:`, JSON.stringify(data).substring(0, 500));
      
      // Handle different response statuses from cobalt
      // status: tunnel, redirect, picker, error
      if (data.status === 'tunnel' || data.status === 'redirect') {
        if (data.url) {
          return { url: data.url, filename: data.filename };
        }
      }
      
      if (data.status === 'picker' && data.picker?.length > 0) {
        // For picker, get the first audio option
        const audioItem = data.picker.find((p: any) => p.type === 'audio') || data.picker[0];
        if (audioItem?.url) {
          return { url: audioItem.url, filename: data.filename };
        }
      }
      
      // Legacy format support
      if (data.url) {
        return { url: data.url, filename: data.filename };
      }
      if (data.audio) {
        return { url: data.audio, filename: data.filename };
      }
      
    } catch (e) {
      console.log(`${instance} error:`, e);
    }
  }

  // Fallback: Try y2mate style services
  try {
    console.log('Trying y2mate fallback...');
    const searchResp = await fetch("https://www.y2mate.com/mates/analyzeV2/ajax", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `k_query=${encodeURIComponent(youtubeUrl)}&k_page=home&hl=en&q_auto=0`,
    });
    
    if (searchResp.ok) {
      const searchData = await searchResp.json();
      console.log('y2mate search response:', JSON.stringify(searchData).substring(0, 300));
      
      if (searchData.links?.mp3) {
        const mp3Key = Object.keys(searchData.links.mp3)[0];
        if (mp3Key) {
          const mp3Info = searchData.links.mp3[mp3Key];
          
          const convertResp = await fetch("https://www.y2mate.com/mates/convertV2/index", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `vid=${searchData.vid}&k=${encodeURIComponent(mp3Info.k)}`,
          });
          
          if (convertResp.ok) {
            const convertData = await convertResp.json();
            console.log('y2mate convert response:', JSON.stringify(convertData).substring(0, 300));
            
            if (convertData.dlink) {
              return { url: convertData.dlink };
            }
          }
        }
      }
    }
  } catch (e) {
    console.log('y2mate error:', e);
  }

  return null;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Try to authenticate (optional - allows anonymous access)
  const { userId, identifier } = await tryAuthenticate(req);
  if (userId) {
    console.log(`Authenticated download request from user: ${userId.slice(0, 8)}...`);
  } else {
    console.log(`Anonymous download request from: ${identifier.slice(0, 12)}...`);
  }

  try {
    const { videoId, title, artist } = await req.json();

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Video ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Download request for: ${videoId} - ${title} by ${artist}`);

    const filename = `${title || 'audio'} - ${artist || 'unknown'}.mp3`.replace(/[<>:"/\\|?*]/g, '');

    // Try to get download URL
    const result = await getDownloadUrl(videoId);
    
    if (result?.url) {
      console.log(`Got download URL: ${result.url.substring(0, 100)}...`);
      
      return new Response(
        JSON.stringify({ 
          status: 'success',
          url: result.url,
          filename: result.filename || filename,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If all services fail, return fallback URLs for manual download
    console.log('All services failed, returning fallback pages');
    
    return new Response(
      JSON.stringify({ 
        status: 'fallback',
        urls: [
          `https://cobalt.tools`,
          `https://y2mate.com/youtube-mp3/${videoId}`,
          `https://www.yt-download.org/api/button/mp3/${videoId}`,
        ],
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        filename,
        message: 'Direct download unavailable. Opening download page.'
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
