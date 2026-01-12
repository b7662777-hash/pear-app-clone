import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reliable download services - ordered by reliability
const SERVICES = [
  {
    name: 'cobalt-api',
    getUrl: async (videoId: string) => {
      try {
        // Using cobalt.tools API - most reliable
        const response = await fetch("https://api.cobalt.tools/", {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${videoId}`,
            downloadMode: "audio",
            audioFormat: "mp3",
          }),
        });
        
        if (!response.ok) {
          console.log('Cobalt API response not ok:', response.status);
          return null;
        }
        
        const data = await response.json();
        console.log('Cobalt API response:', JSON.stringify(data));
        
        if (data.url) {
          return data.url;
        }
        if (data.audio) {
          return data.audio;
        }
        return null;
      } catch (e) {
        console.log('Cobalt API error:', e);
        return null;
      }
    }
  },
  {
    name: 'y2meta',
    getUrl: async (videoId: string) => {
      try {
        // Y2meta analyze endpoint
        const analyzeUrl = `https://www.y2meta.com/mates/analyzeV2/ajax`;
        const response = await fetch(analyzeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `k_query=https://www.youtube.com/watch?v=${videoId}&k_page=home&hl=en&q_auto=0`,
        });
        
        if (!response.ok) return null;
        const data = await response.json();
        console.log('Y2meta analyze:', JSON.stringify(data).substring(0, 500));
        
        if (data.links?.mp3) {
          const mp3Links = Object.values(data.links.mp3) as any[];
          if (mp3Links.length > 0) {
            const bestLink = mp3Links.find((l: any) => l.q === '128kbps') || mp3Links[0];
            if (bestLink?.k) {
              // Convert link
              const convertResponse = await fetch(`https://www.y2meta.com/mates/convertV2/index`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `vid=${videoId}&k=${encodeURIComponent(bestLink.k)}`,
              });
              
              if (convertResponse.ok) {
                const convertData = await convertResponse.json();
                console.log('Y2meta convert:', JSON.stringify(convertData));
                if (convertData.dlink) {
                  return convertData.dlink;
                }
              }
            }
          }
        }
        return null;
      } catch (e) {
        console.log('Y2meta error:', e);
        return null;
      }
    }
  },
  {
    name: 'ssyoutube',
    getUrl: async (videoId: string) => {
      try {
        const response = await fetch(`https://ssyoutube.com/api/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${videoId}`,
            format: 'mp3',
          }),
        });
        
        if (!response.ok) return null;
        const data = await response.json();
        console.log('SSYoutube response:', JSON.stringify(data));
        return data.url || data.downloadUrl || null;
      } catch (e) {
        console.log('SSYoutube error:', e);
        return null;
      }
    }
  },
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Try each service until one works
    for (const service of SERVICES) {
      try {
        console.log(`Trying ${service.name}...`);
        const downloadUrl = await service.getUrl(videoId);
        
        if (downloadUrl) {
          console.log(`Got URL from ${service.name}: ${downloadUrl.substring(0, 100)}...`);
          
          // Return the download URL directly for client-side download
          return new Response(
            JSON.stringify({ 
              status: 'success',
              url: downloadUrl,
              filename,
              service: service.name
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (serviceError) {
        console.log(`${service.name} failed:`, serviceError);
        continue;
      }
    }

    // If all services fail, return fallback URLs
    console.log('All services failed, returning fallback');
    
    return new Response(
      JSON.stringify({ 
        status: 'fallback',
        urls: [
          `https://www.yt-download.org/api/button/mp3/${videoId}`,
          `https://y2mate.is/youtube-to-mp3/${videoId}`,
          `https://loader.to/api/card/?url=https://www.youtube.com/watch?v=${videoId}&f=mp3`
        ],
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
