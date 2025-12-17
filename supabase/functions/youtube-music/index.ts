import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get API key from environment
const YTM_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

// YouTube Music API base URL
const YTM_BASE_URL = "https://music.youtube.com/youtubei/v1";

// Musixmatch config
const MXM_BASE_URL = "https://www.musixmatch.com/ws/1.1/";
const MXM_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Cache for Musixmatch secret
let mxmSecretCache: { secret: string; timestamp: number } | null = null;
const MXM_CACHE_TTL = 3600000; // 1 hour

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

// ==================== MUSIXMATCH API ====================

async function getMxmLatestAppUrl(): Promise<string> {
  const response = await fetch("https://www.musixmatch.com/search", {
    headers: {
      "User-Agent": MXM_USER_AGENT,
      "Cookie": "mxm_bab=AB",
    },
  });
  
  const html = await response.text();
  const pattern = /src="([^"]*\/_next\/static\/chunks\/pages\/_app-[^"]+\.js)"/;
  const match = html.match(pattern);
  
  if (!match) {
    throw new Error("Could not find Musixmatch _app URL");
  }
  
  return match[1];
}

async function getMxmSecret(): Promise<string> {
  // Check cache
  if (mxmSecretCache && Date.now() - mxmSecretCache.timestamp < MXM_CACHE_TTL) {
    return mxmSecretCache.secret;
  }
  
  console.log("Fetching new Musixmatch secret...");
  const appUrl = await getMxmLatestAppUrl();
  
  const response = await fetch(appUrl, {
    headers: { "User-Agent": MXM_USER_AGENT },
  });
  
  const js = await response.text();
  const pattern = /from\(\s*"(.*?)"\s*\.split/;
  const match = js.match(pattern);
  
  if (!match) {
    throw new Error("Could not find Musixmatch secret in JS");
  }
  
  // Reverse and decode base64
  const reversed = match[1].split('').reverse().join('');
  const decoded = atob(reversed);
  
  // Cache the secret
  mxmSecretCache = { secret: decoded, timestamp: Date.now() };
  console.log("Musixmatch secret cached");
  
  return decoded;
}

async function generateMxmSignature(url: string, secret: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  const message = url + year + month + day;
  
  // HMAC-SHA256 using Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `&signature=${encodeURIComponent(base64)}&signature_protocol=sha256`;
}

async function mxmRequest(endpoint: string, params: Record<string, string>): Promise<any> {
  const secret = await getMxmSecret();
  
  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  
  const url = `${MXM_BASE_URL}${endpoint}?app_id=web-desktop-app-v1.0&format=json&${queryString}`;
  const signature = await generateMxmSignature(url, secret);
  const signedUrl = url + signature;
  
  const response = await fetch(signedUrl.replace(/%20/g, '+').replace(/ /g, '+'), {
    headers: { "User-Agent": MXM_USER_AGENT },
  });
  
  return response.json();
}

async function searchMxmTracks(query: string): Promise<any[]> {
  try {
    const data = await mxmRequest("track.search", {
      q: query,
      f_has_lyrics: "1",
      page_size: "10",
      page: "1",
      s_track_rating: "desc",
    });
    
    console.log("Musixmatch search response status:", data?.message?.header?.status_code);
    
    const trackList = data?.message?.body?.track_list || [];
    return trackList.map((item: any) => ({
      track_id: item.track.track_id,
      commontrack_id: item.track.commontrack_id,
      track_name: item.track.track_name,
      artist_name: item.track.artist_name,
      album_name: item.track.album_name,
      has_lyrics: item.track.has_lyrics,
      has_richsync: item.track.has_richsync,
    }));
  } catch (error) {
    console.error("Musixmatch search error:", error);
    return [];
  }
}

async function getMxmLyrics(trackId: number): Promise<string | null> {
  const data = await mxmRequest("track.lyrics.get", {
    track_id: trackId.toString(),
  });
  
  return data?.message?.body?.lyrics?.lyrics_body || null;
}

async function getMxmRichsync(trackId: number): Promise<Array<{time: number, text: string}> | null> {
  try {
    const data = await mxmRequest("track.richsync.get", {
      track_id: trackId.toString(),
    });
    
    const richsyncBody = data?.message?.body?.richsync?.richsync_body;
    if (!richsyncBody) return null;
    
    // Parse richsync JSON
    const parsed = JSON.parse(richsyncBody);
    return parsed.map((item: any) => ({
      time: item.ts,
      text: item.x,
    }));
  } catch (error) {
    console.error("Error getting richsync:", error);
    return null;
  }
}

async function getMusixmatchLyrics(title: string, artist: string) {
  console.log(`Getting Musixmatch lyrics for: ${title} by ${artist}`);
  
  try {
    // Clean up title and artist for better matching
    const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
    const cleanArtist = artist.split(/[,&]/)[0].trim();
    
    // Try multiple search strategies
    const searchQueries = [
      `${cleanTitle} ${cleanArtist}`,
      cleanTitle,
      `${title} ${artist}`,
    ];
    
    let tracks: any[] = [];
    for (const query of searchQueries) {
      console.log(`Trying Musixmatch search: ${query}`);
      tracks = await searchMxmTracks(query);
      if (tracks && tracks.length > 0) break;
    }
    
    if (!tracks || tracks.length === 0) {
      console.log("No tracks found on Musixmatch after all attempts");
      return null;
    }
    
    // Find best match - prefer tracks with richsync
    let track = tracks.find(t => t.has_richsync) || tracks.find(t => t.has_lyrics) || tracks[0];
    console.log(`Found track: ${track.track_name} by ${track.artist_name} (ID: ${track.track_id}, richsync: ${track.has_richsync})`);
    
    // Try richsync first (synced lyrics)
    if (track.has_richsync) {
      const richsync = await getMxmRichsync(track.track_id);
      if (richsync && richsync.length > 0) {
        console.log("Richsync lyrics found");
        return {
          synced: true,
          lyrics: richsync,
          plainLyrics: null,
          source: "musixmatch",
        };
      }
    }
    
    // Fall back to plain lyrics
    if (track.has_lyrics) {
      const lyrics = await getMxmLyrics(track.track_id);
      if (lyrics) {
        console.log("Plain lyrics found from Musixmatch");
        return {
          synced: false,
          lyrics: null,
          plainLyrics: lyrics,
          source: "musixmatch",
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Musixmatch error:", error);
    return null;
  }
}

// ==================== YOUTUBE MUSIC API ====================

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

// Get lyrics from YouTube Music
async function getYouTubeMusicLyrics(videoId: string) {
  validateVideoId(videoId);
  console.log(`Getting YouTube Music lyrics for: ${videoId}`);
  
  try {
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
      console.log("No lyrics available on YouTube Music");
      return null;
    }

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
    
    const lyricsContent = browseData?.contents?.sectionListRenderer?.contents?.[0]?.musicDescriptionShelfRenderer?.description?.runs;
    
    if (lyricsContent && lyricsContent[0]) {
      const lyrics = lyricsContent[0].text;
      console.log("YouTube Music lyrics found");
      return {
        synced: false,
        lyrics: null,
        plainLyrics: lyrics,
        source: "youtube",
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting YouTube Music lyrics:", error);
    return null;
  }
}

// ==================== LRCLIB API ====================

async function getLrcLibLyrics(title: string, artist: string) {
  console.log(`Getting LRCLIB lyrics for: ${title} by ${artist}`);
  
  try {
    const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Lovable Music App/1.0',
      },
    });

    if (!response.ok) {
      console.error(`LRCLIB search error: ${response.status}`);
      return null;
    }

    const results = await response.json();
    
    if (!results || results.length === 0) {
      console.log("No results from LRCLIB");
      return null;
    }

    const withSyncedLyrics = results.find((r: any) => r.syncedLyrics);
    
    if (withSyncedLyrics?.syncedLyrics) {
      console.log("Synced lyrics found");
      return {
        synced: true,
        lyrics: parseLRC(withSyncedLyrics.syncedLyrics),
        plainLyrics: withSyncedLyrics.plainLyrics || null,
        source: "lrclib",
      };
    }

    if (results[0]?.plainLyrics) {
      console.log("Only plain lyrics available");
      return {
        synced: false,
        lyrics: null,
        plainLyrics: results[0].plainLyrics,
        source: "lrclib",
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting LRCLIB lyrics:", error);
    return null;
  }
}

function parseLRC(lrc: string): Array<{time: number, text: string}> {
  const lines = lrc.split('\n');
  const result: Array<{time: number, text: string}> = [];
  
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      
      if (text) {
        result.push({ time, text });
      }
    }
  }
  
  return result.sort((a, b) => a.time - b.time);
}

// ==================== UNIFIED LYRICS FETCHER ====================

async function getSyncedLyrics(title: string, artist: string, provider: string = "lrclib", videoId?: string) {
  console.log(`Getting lyrics from provider: ${provider}`);
  
  switch (provider) {
    case "musixmatch":
      return await getMusixmatchLyrics(title, artist);
    
    case "youtube":
      if (!videoId) {
        console.log("VideoId required for YouTube Music lyrics");
        return null;
      }
      return await getYouTubeMusicLyrics(videoId);
    
    case "lrclib":
    default:
      return await getLrcLibLyrics(title, artist);
  }
}

// Legacy function for backward compatibility
async function getLyrics(videoId: string) {
  validateVideoId(videoId);
  const result = await getYouTubeMusicLyrics(videoId);
  return result?.plainLyrics || null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, videoId, title, artist, provider } = await req.json();
    console.log(`Action: ${action}, Query: ${query}, VideoId: ${videoId}, Title: ${title}, Artist: ${artist}, Provider: ${provider}`);

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

      case "synced-lyrics":
        if (!title || !artist) {
          throw new Error("Title and artist are required for synced lyrics");
        }
        result = await getSyncedLyrics(title, artist, provider || "lrclib", videoId);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in youtube-music function:', error);
    
    const isValidationError = error.message?.includes('required') || 
                              error.message?.includes('Invalid') ||
                              error.message?.includes('must be');
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: isValidationError ? 'Invalid request' : 'Service temporarily unavailable'
    }), {
      status: isValidationError ? 400 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
