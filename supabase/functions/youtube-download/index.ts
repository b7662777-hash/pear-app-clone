import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fast and reliable services for YouTube audio extraction - ordered by speed
const SERVICES = [
  {
    name: 'loader-to',
    priority: 1,
    getUrl: async (videoId: string) => {
      try {
        // Loader.to API - fast and reliable
        const response = await fetch(`https://loader.to/ajax/download.php?format=mp3&url=https://www.youtube.com/watch?v=${videoId}`);
        
        if (!response.ok) return null;
        const data = await response.json();
        console.log('Loader.to initial response:', JSON.stringify(data));
        
        if (data.download_url) {
          return data.download_url;
        }
        
        // Poll for completion with shorter intervals
        if (data.id) {
          for (let i = 0; i < 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s interval
            const progressResponse = await fetch(`https://loader.to/ajax/progress.php?id=${data.id}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              console.log('Loader.to progress:', progressData.progress, progressData.text);
              if (progressData.download_url) {
                return progressData.download_url;
              }
              if (progressData.success === 1) {
                return progressData.download_url;
              }
            }
          }
        }
        return null;
      } catch (e) {
        console.log('Loader.to error:', e);
        return null;
      }
    }
  },
  {
    name: 'cobalt-v2',
    priority: 2,
    getUrl: async (videoId: string) => {
      try {
        const response = await fetch("https://co.wuk.sh/api/json", {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${videoId}`,
            aFormat: "mp3",
            isAudioOnly: true,
            filenamePattern: "basic",
          }),
        });
        
        if (!response.ok) return null;
        const data = await response.json();
        console.log('Cobalt v2 response:', JSON.stringify(data));
        return data.url || data.audio || null;
      } catch (e) {
        console.log('Cobalt v2 error:', e);
        return null;
      }
    }
  },
  {
    name: 'cobalt-main',
    priority: 3,
    getUrl: async (videoId: string) => {
      try {
        const response = await fetch("https://api.cobalt.tools/api/json", {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${videoId}`,
            aFormat: "mp3",
            isAudioOnly: true,
          }),
        });
        
        if (!response.ok) return null;
        const data = await response.json();
        console.log('Cobalt main response:', JSON.stringify(data));
        return data.url || data.audio || null;
      } catch (e) {
        console.log('Cobalt main error:', e);
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
          console.log(`Got URL from ${service.name}: ${downloadUrl}`);
          
          // Fetch the actual audio file and return it
          try {
            const audioResponse = await fetch(downloadUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              }
            });
            
            if (audioResponse.ok) {
              const contentType = audioResponse.headers.get('content-type');
              console.log(`${service.name} content-type: ${contentType}`);
              
              // Check if it's actually audio
              if (contentType?.includes('audio') || contentType?.includes('octet-stream')) {
                const audioBlob = await audioResponse.arrayBuffer();
                
                console.log(`Success with ${service.name}, size: ${audioBlob.byteLength} bytes`);
                
                if (audioBlob.byteLength > 10000) { // At least 10KB to be a valid audio file
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
            }
          } catch (fetchError) {
            console.log(`Failed to fetch audio from ${service.name}:`, fetchError);
          }
        }
      } catch (serviceError) {
        console.log(`${service.name} failed:`, serviceError);
        continue;
      }
    }

    // If all direct services fail, return a redirect URL to a working download page
    console.log('All direct services failed, returning redirect options');
    
    return new Response(
      JSON.stringify({ 
        status: 'fallback',
        urls: [
          `https://www.yt-download.org/api/button/mp3/${videoId}`,
          `https://y2mate.is/youtube-to-mp3/${videoId}`,
        ],
        filename,
        message: 'Direct download unavailable. Please use the fallback link.'
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
