import { YouTubeTrack } from './useYouTubeMusic';

const CACHE_KEY = 'recommended_tracks_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  tracks: YouTubeTrack[];
  timestamp: number;
}

export function getCachedRecommended(): YouTubeTrack[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return entry.tracks;
  } catch {
    return null;
  }
}

export function setCachedRecommended(tracks: YouTubeTrack[]): void {
  try {
    const entry: CacheEntry = {
      tracks,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage errors
  }
}

// Preload LCP image from cache on page load
export function preloadLCPFromCache(): void {
  const cached = getCachedRecommended();
  if (cached && cached.length > 4 && cached[4]?.thumbnail) {
    const imageUrl = cached[4].thumbnail;
    
    // Check if preload already exists
    const existing = document.querySelector(`link[rel="preload"][href="${imageUrl}"]`);
    if (existing) return;
    
    // Create preload link for LCP image
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = imageUrl;
    preloadLink.setAttribute('fetchpriority', 'high');
    document.head.appendChild(preloadLink);
  }
}
