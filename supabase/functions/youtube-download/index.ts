import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cobalt API - open source YouTube downloader
const COBALT_API_URL = "https://api.cobalt.tools/api/json";

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

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Request audio download from Cobalt API
    const response = await fetch(COBALT_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: youtubeUrl,
        vCodec: "h264",
        vQuality: "720",
        aFormat: "mp3",
        isAudioOnly: true,
        filenamePattern: "basic",
      }),
    });

    if (!response.ok) {
      console.error(`Cobalt API error: ${response.status}`);
      
      // Try alternative method - direct stream URL
      const alternativeUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
      
      return new Response(
        JSON.stringify({ 
          status: 'redirect',
          url: alternativeUrl,
          filename: `${title} - ${artist}.mp3`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("Cobalt response:", JSON.stringify(data));

    if (data.status === 'error') {
      // Fallback to alternative
      const alternativeUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
      
      return new Response(
        JSON.stringify({ 
          status: 'redirect',
          url: alternativeUrl,
          filename: `${title} - ${artist}.mp3`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cobalt returns the download URL
    const downloadUrl = data.url || data.audio;
    
    if (!downloadUrl) {
      const alternativeUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
      
      return new Response(
        JSON.stringify({ 
          status: 'redirect',
          url: alternativeUrl,
          filename: `${title} - ${artist}.mp3`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        status: 'stream',
        url: downloadUrl,
        filename: `${title} - ${artist}.mp3`
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
