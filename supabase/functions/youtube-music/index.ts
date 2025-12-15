import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get API key from environment
const YTM_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

// YouTube Music API base URL
const YTM_BASE_URL = "https://music.youtube.com/youtubei/v1";

// Input validation
const MAX_QUERY_LENGTH = 200;
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function validateQuery(query: string): void {
  if (!query || typeof query !== 'string') {
    throw new Error('Query is required and must be a string');
  }
  if (query.length > MAX_QUERY_LENGTH) {
    throw new Error(`Query must be less than ${MAX_QUERY_LENGTH} characters`);
  }
}

function validateVideoId(videoId: string): void {
  if (!videoId || typeof videoId !== 'string') {
    throw new Error('VideoId is required and must be a string');
  }
  if (!VIDEO_ID_REGEX.test(videoId)) {
    throw new Error('Invalid video ID format');
  }
}

// Common request headers for YouTube Music API
const getYTMHeaders = () => ({
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": "https://music.youtube.com",
  "Referer": "https://music.youtube.com/",
});

// YouTube Music API context
const getContext = () => ({
  client: {
    clientName: "WEB_REMIX",
    clientVersion: "1.20231204.01.00",
    hl: "en",
    gl: "US",
  },
});

// Search YouTube Music
async function searchYouTubeMusic(query: string) {
  validateQuery(query);
  console.log(`Searching YouTube Music for: ${query}`);
  
  const url = `${YTM_BASE_URL}/search?key=${YTM_API_KEY}`;
  
  const body = {
    context: getContext(),
    query: query,
    params: "EgWKAQIIAWoKEAMQBBAKEAkQBQ%3D%3D", // Filter for songs
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getYTMHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`YouTube Music API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Search response received");
    
    // Parse search results
    const results = parseSearchResults(data);
    console.log(`Found ${results.length} results`);
    
    return results;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}

// Parse search results from YouTube Music API response
function parseSearchResults(data: any) {
  const results: any[] = [];
  
  try {
    const contents = data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
    
    if (!contents) {
      console.log("No contents found in search response");
      return results;
    }

    for (const section of contents) {
      const musicShelf = section?.musicShelfRenderer;
      if (!musicShelf) continue;

      const items = musicShelf?.contents || [];
      
      for (const item of items) {
        const musicResponsiveListItemRenderer = item?.musicResponsiveListItemRenderer;
        if (!musicResponsiveListItemRenderer) continue;

        try {
          const videoId = musicResponsiveListItemRenderer?.playlistItemData?.videoId ||
                         musicResponsiveListItemRenderer?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;
          
          if (!videoId) continue;

          const flexColumns = musicResponsiveListItemRenderer?.flexColumns || [];
          
          let title = "";
          let artist = "";
          let album = "";
          let duration = "";

          // Parse title from first flex column
          if (flexColumns[0]) {
            const runs = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
            if (runs && runs[0]) {
              title = runs[0].text;
            }
          }

          // Parse artist, album, duration from second flex column
          if (flexColumns[1]) {
            const runs = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
            if (runs) {
              const textParts = runs.map((r: any) => r.text).join("");
              const parts = textParts.split(" • ");
              if (parts[0]) artist = parts[0].trim();
              if (parts[1]) album = parts[1].trim();
              if (parts[2]) duration = parts[2].trim();
            }
          }

          // Get thumbnail
          const thumbnails = musicResponsiveListItemRenderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
          const thumbnail = thumbnails[thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          results.push({
            videoId,
            title,
            artist,
            album,
            duration,
            thumbnail,
          });
        } catch (parseError) {
          console.error("Error parsing item:", parseError);
        }
      }
    }
  } catch (error) {
    console.error("Error parsing search results:", error);
  }

  return results.slice(0, 20); // Return max 20 results
}

// Get lyrics for a video
async function getLyrics(videoId: string) {
  validateVideoId(videoId);
  console.log(`Getting lyrics for video: ${videoId}`);
  
  try {
    // First, get the browse ID for lyrics
    const watchUrl = `${YTM_BASE_URL}/next?key=${YTM_API_KEY}`;
    
    const watchBody = {
      context: getContext(),
      videoId: videoId,
      isAudioOnly: true,
    };

    const watchResponse = await fetch(watchUrl, {
      method: "POST",
      headers: getYTMHeaders(),
      body: JSON.stringify(watchBody),
    });

    if (!watchResponse.ok) {
      console.error(`Watch API error: ${watchResponse.status}`);
      return null;
    }

    const watchData = await watchResponse.json();
    
    // Find lyrics tab
    const tabs = watchData?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs || [];
    
    let lyricsBrowseId = null;
    
    for (const tab of tabs) {
      const endpoint = tab?.tabRenderer?.endpoint;
      if (endpoint?.browseEndpoint?.browseId?.startsWith("MPLYt")) {
        lyricsBrowseId = endpoint.browseEndpoint.browseId;
        break;
      }
    }

    if (!lyricsBrowseId) {
      console.log("No lyrics available for this track");
      return null;
    }

    // Fetch lyrics content
    const browseUrl = `${YTM_BASE_URL}/browse?key=${YTM_API_KEY}`;
    
    const browseBody = {
      context: getContext(),
      browseId: lyricsBrowseId,
    };

    const browseResponse = await fetch(browseUrl, {
      method: "POST",
      headers: getYTMHeaders(),
      body: JSON.stringify(browseBody),
    });

    if (!browseResponse.ok) {
      console.error(`Browse API error: ${browseResponse.status}`);
      return null;
    }

    const browseData = await browseResponse.json();
    
    // Extract lyrics text
    const lyricsContent = browseData?.contents?.sectionListRenderer?.contents?.[0]?.musicDescriptionShelfRenderer?.description?.runs;
    
    if (lyricsContent && lyricsContent[0]) {
      const lyrics = lyricsContent[0].text;
      console.log("Lyrics found");
      return lyrics;
    }

    console.log("No lyrics content found");
    return null;
  } catch (error) {
    console.error("Error getting lyrics:", error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, videoId } = await req.json();
    console.log(`Action: ${action}, Query: ${query}, VideoId: ${videoId}`);

    let result;

    switch (action) {
      case "search":
        if (!query) {
          throw new Error("Query is required for search");
        }
        result = await searchYouTubeMusic(query);
        break;
        
      case "lyrics":
        if (!videoId) {
          throw new Error("VideoId is required for lyrics");
        }
        result = await getLyrics(videoId);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in youtube-music function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
