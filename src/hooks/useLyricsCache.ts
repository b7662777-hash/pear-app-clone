import { LyricsData } from "@/hooks/useYouTubeMusic";

const CACHE_KEY_PREFIX = "lyrics_cache_";
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedLyrics {
  data: LyricsData;
  timestamp: number;
}

function getCacheKey(title: string, artist: string): string {
  const normalized = `${title.toLowerCase().trim()}_${artist.toLowerCase().trim()}`;
  return `${CACHE_KEY_PREFIX}${normalized.replace(/[^a-z0-9]/g, '_')}`;
}

export function getCachedLyrics(title: string, artist: string): LyricsData | null {
  try {
    const key = getCacheKey(title, artist);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const parsed: CachedLyrics = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    
    console.log("Lyrics loaded from cache:", title);
    return parsed.data;
  } catch (error) {
    console.error("Error reading lyrics cache:", error);
    return null;
  }
}

export function setCachedLyrics(title: string, artist: string, data: LyricsData): void {
  try {
    const key = getCacheKey(title, artist);
    const cached: CachedLyrics = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cached));
    console.log("Lyrics cached:", title);
  } catch (error) {
    console.error("Error caching lyrics:", error);
    // If localStorage is full, clear old entries
    clearOldLyricsCache();
  }
}

function clearOldLyricsCache(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX));
    keys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed: CachedLyrics = JSON.parse(cached);
          if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing lyrics cache:", error);
  }
}
