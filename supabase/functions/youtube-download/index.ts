import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple fallback services for YouTube audio extraction
const SERVICES = [
  {
    name: 'cobalt',
    getUrl: async (videoId: string) => {
      const response = await fetch("https://api.cobalt.tools/", {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          audioFormat: "mp3",
          isAudioOnly: true,
          downloadMode: "audio",
        }),
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      return data.url || data.audio || null;
    }
  },
  {
    name: 'y2mate',
    getUrl: async (videoId: string) => {
      // Y2mate API endpoint
      const analyzeResponse = await fetch(`https://www.y2mate.com/mates/analyzeV2/ajax`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `k_query=https://www.youtube.com/watch?v=${videoId}&k_page=home&hl=en&q_auto=0`,
      });
      
      if (!analyzeResponse.ok) return null;
      const analyzeData = await analyzeResponse.json();
      
      if (analyzeData.status !== 'ok' || !analyzeData.links?.mp3) return null;
      
      // Get the highest quality MP3
      const mp3Links = analyzeData.links.mp3;
      const bestQuality = Object.values(mp3Links)[0] as any;
      
      if (!bestQuality?.k) return null;
      
      // Convert to get download URL
      const convertResponse = await fetch(`https://www.y2mate.com/mates/convertV2/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `vid=${videoId}&k=${bestQuality.k}`,
      });
      
      if (!convertResponse.ok) return null;
      const convertData = await convertResponse.json();
      
      return convertData.dlink || null;
    }
  },
  {
    name: 'ssyoutube',
    getUrl: async (videoId: string) => {
      // SaveFrom/SSYoutube style API
      const response = await fetch(`https://api.ssyoutube.com/api/convert`, {
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
      return data.url || data.downloadUrl || null;
    }
  }
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

    const filename = `${title} - ${artist}.mp3`.replace(/[<>:"/\\|?*]/g, '');

    // Try each service until one works
    for (const service of SERVICES) {
      try {
        console.log(`Trying ${service.name}...`);
        const downloadUrl = await service.getUrl(videoId);
        
        if (downloadUrl) {
          console.log(`Success with ${service.name}: ${downloadUrl}`);
          
          // Fetch the actual audio file and return it
          const audioResponse = await fetch(downloadUrl);
          
          if (audioResponse.ok) {
            const audioBlob = await audioResponse.arrayBuffer();
            
            return new Response(audioBlob, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Content-Length': audioBlob.byteLength.toString(),
              }
            });
          }
        }
      } catch (serviceError) {
        console.log(`${service.name} failed:`, serviceError);
        continue;
      }
    }

    // If all services fail, return a fallback URL for direct browser handling
    console.log('All services failed, returning fallback URL');
    
    // Try to return a direct embed URL that might work
    const fallbackUrl = `https://www.yt-download.org/api/button/mp3/${videoId}`;
    
    return new Response(
      JSON.stringify({ 
        status: 'fallback',
        url: fallbackUrl,
        filename,
        message: 'Direct download services unavailable. Opening fallback page.'
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
