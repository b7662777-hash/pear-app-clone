import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple reliable download services
const getDownloadUrl = async (videoId: string): Promise<string | null> => {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Service 1: Try co.wuk.sh (cobalt community instance)
  try {
    console.log('Trying co.wuk.sh...');
    const response = await fetch("https://co.wuk.sh/api/json", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: youtubeUrl,
        aFormat: "mp3",
        isAudioOnly: true,
        audioBitrate: "128",
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('co.wuk.sh response:', JSON.stringify(data));
      if (data.url) return data.url;
      if (data.audio) return data.audio;
    }
  } catch (e) {
    console.log('co.wuk.sh error:', e);
  }

  // Service 2: Try api.cobalt.tools (may require solving captcha)
  try {
    console.log('Trying api.cobalt.tools...');
    const response = await fetch("https://api.cobalt.tools/", {
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
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('api.cobalt.tools response:', JSON.stringify(data));
      if (data.url) return data.url;
      if (data.audio) return data.audio;
    }
  } catch (e) {
    console.log('api.cobalt.tools error:', e);
  }

  // Service 3: Try cnvmp3.com API
  try {
    console.log('Trying cnvmp3.com...');
    const response = await fetch(`https://cnvmp3.com/fetch_video.php?url=${encodeURIComponent(youtubeUrl)}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('cnvmp3.com response:', JSON.stringify(data));
      if (data.download_url) return data.download_url;
      if (data.url) return data.url;
    }
  } catch (e) {
    console.log('cnvmp3.com error:', e);
  }

  // Service 4: Try tomp3.cc API
  try {
    console.log('Trying tomp3.cc...');
    const response = await fetch("https://tomp3.cc/api/ajax/search", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `query=${encodeURIComponent(youtubeUrl)}&vt=mp3`,
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('tomp3.cc search response:', JSON.stringify(data).substring(0, 300));
      
      if (data.links?.mp3) {
        const mp3Link = Object.values(data.links.mp3)[0] as any;
        if (mp3Link?.k) {
          // Convert
          const convertResponse = await fetch("https://tomp3.cc/api/ajax/convert", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `vid=${data.vid}&k=${encodeURIComponent(mp3Link.k)}`,
          });
          
          if (convertResponse.ok) {
            const convertData = await convertResponse.json();
            console.log('tomp3.cc convert response:', JSON.stringify(convertData));
            if (convertData.dlink) return convertData.dlink;
          }
        }
      }
    }
  } catch (e) {
    console.log('tomp3.cc error:', e);
  }

  // Service 5: Try 320ytmp3.com
  try {
    console.log('Trying 320ytmp3.com...');
    const response = await fetch(`https://api.320ytmp3.com/v1/fetch?url=${encodeURIComponent(youtubeUrl)}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('320ytmp3.com response:', JSON.stringify(data));
      if (data.url) return data.url;
      if (data.downloadUrl) return data.downloadUrl;
    }
  } catch (e) {
    console.log('320ytmp3.com error:', e);
  }

  return null;
};

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

    // Try to get download URL
    const downloadUrl = await getDownloadUrl(videoId);
    
    if (downloadUrl) {
      console.log(`Got download URL: ${downloadUrl.substring(0, 80)}...`);
      
      return new Response(
        JSON.stringify({ 
          status: 'success',
          url: downloadUrl,
          filename,
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
          `https://cobalt.tools/#${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
          `https://www.yt-download.org/api/button/mp3/${videoId}`,
          `https://y2mate.is/en/youtube-mp3/${videoId}`,
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
