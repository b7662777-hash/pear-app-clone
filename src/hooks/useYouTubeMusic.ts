import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCachedLyrics, setCachedLyrics } from "@/hooks/useLyricsCache";
import { getCachedRecommended, setCachedRecommended, preloadLCPFromCache } from "@/hooks/useRecommendedCache";

// Video ID validation regex (YouTube IDs are 11 characters: a-z, A-Z, 0-9, -, _)
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function isValidVideoId(videoId: string): boolean {
  return typeof videoId === 'string' && VIDEO_ID_REGEX.test(videoId);
}

export interface YouTubeTrack {
  videoId: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  thumbnail: string;
}

export interface SyncedLyricLine {
  time: number;
  text: string;
}

export interface LyricsData {
  synced: boolean;
  lyrics: SyncedLyricLine[] | null;
  plainLyrics: string | null;
  source?: string;
}

export type LyricsProvider = "lrclib" | "musixmatch" | "youtube";

const PROVIDER_ORDER: LyricsProvider[] = ["lrclib", "musixmatch", "youtube"];

export function useYouTubeMusic() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<YouTubeTrack[]>([]);
  const [relatedTracks, setRelatedTracks] = useState<YouTubeTrack[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  // Initialize with cached data for instant LCP
  const [recommendedTracks, setRecommendedTracks] = useState<YouTubeTrack[]>(() => getCachedRecommended() || []);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Preload LCP image from cache immediately
  useEffect(() => {
    preloadLCPFromCache();
  }, []);

  // Helper to handle auth errors — only redirect for explicit requiresAuth, not generic 401s
  const handleAuthError = useCallback((data: any, error: any) => {
    if (data?.requiresAuth === true) {
      console.warn("[useYouTubeMusic] Server requires auth, redirecting");
      setRequiresAuth(true);
      toast({
        title: "Login required",
        description: "Please log in to search and play music.",
        variant: "destructive",
      });
      navigate('/auth');
      return true;
    }
    if (error?.message?.includes('401')) {
      console.warn("[useYouTubeMusic] 401 error, but not redirecting — treating as transient");
    }
    return false;
  }, [navigate, toast]);

  const searchTracks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return [];
    }

    setIsSearching(true);
    setRequiresAuth(false);
    try {
      console.log("Searching for:", query);
      
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "search", query },
      });

      if (handleAuthError(data, error)) {
        return [];
      }

      if (error) {
        console.error("Search error:", error);
        toast({
          title: "Search failed",
          description: "Could not search for tracks. Please try again.",
          variant: "destructive",
        });
        return [];
      }

      if (data?.success && data?.data) {
        // Filter results to only include tracks with valid video IDs
        const validResults = data.data.filter((track: YouTubeTrack) => 
          track.videoId && isValidVideoId(track.videoId)
        );
        console.log("Search results:", validResults.length);
        setSearchResults(validResults);
        return validResults;
      }

      return [];
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "Could not search for tracks. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [toast, handleAuthError]);

  const fetchFromProvider = useCallback(async (
    title: string,
    artist: string,
    provider: LyricsProvider,
    videoId?: string
  ): Promise<LyricsData | null> => {
    try {
      console.log(`Trying ${provider} for: ${title} by ${artist}`);
      
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "synced-lyrics", title, artist, provider, videoId },
      });

      if (error) {
        console.error(`${provider} error:`, error);
        return null;
      }

      if (data?.success && data?.data && (data.data.lyrics || data.data.plainLyrics)) {
        console.log(`Lyrics found from ${provider}, synced:`, data.data.synced);
        return data.data;
      }

      return null;
    } catch (error) {
      console.error(`${provider} error:`, error);
      return null;
    }
  }, []);

  const fetchSyncedLyrics = useCallback(async (
    title: string, 
    artist: string, 
    provider: LyricsProvider = "lrclib",
    videoId?: string,
    autoFallback: boolean = true
  ) => {
    // Check cache first
    const cached = getCachedLyrics(title, artist);
    if (cached) {
      setLyricsData(cached);
      return cached;
    }

    setIsLoadingLyrics(true);
    setLyricsData(null);
    
    try {
      // First try the requested provider
      let result = await fetchFromProvider(title, artist, provider, videoId);
      
      if (result) {
        setCachedLyrics(title, artist, result);
        setLyricsData(result);
        return result;
      }

      // If autoFallback enabled, try other providers
      if (autoFallback) {
        const otherProviders = PROVIDER_ORDER.filter(p => p !== provider);
        
        for (const fallbackProvider of otherProviders) {
          result = await fetchFromProvider(title, artist, fallbackProvider, videoId);
          if (result) {
            console.log(`Fallback to ${fallbackProvider} successful`);
            setCachedLyrics(title, artist, result);
            setLyricsData(result);
            return result;
          }
        }
      }

      console.log("No lyrics available from any provider");
      return null;
    } catch (error) {
      console.error("Synced lyrics error:", error);
      return null;
    } finally {
      setIsLoadingLyrics(false);
    }
  }, [fetchFromProvider]);

  // Legacy fetchLyrics for backward compatibility
  const fetchLyrics = useCallback(async (videoId: string) => {
    if (!isValidVideoId(videoId)) {
      console.error("Invalid video ID format:", videoId);
      return null;
    }
    
    setIsLoadingLyrics(true);
    setLyricsData(null);
    
    try {
      console.log("Fetching lyrics for:", videoId);
      
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "lyrics", videoId },
      });

      if (error) {
        console.error("Lyrics error:", error);
        return null;
      }

      if (data?.success && data?.data) {
        console.log("Lyrics found");
        setLyricsData({
          synced: false,
          lyrics: null,
          plainLyrics: data.data,
        });
        return data.data;
      }

      console.log("No lyrics available");
      return null;
    } catch (error) {
      console.error("Lyrics error:", error);
      return null;
    } finally {
      setIsLoadingLyrics(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  const clearLyrics = useCallback(() => {
    setLyricsData(null);
  }, []);

  const fetchRelatedTracks = useCallback(async (title: string, artist: string) => {
    setIsLoadingRelated(true);
    setRequiresAuth(false);
    try {
      // Search for related tracks based on artist name
      const query = `${artist} songs`;
      console.log("Fetching related tracks:", query);
      
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "search", query },
      });

      if (handleAuthError(data, error)) {
        return [];
      }

      if (error) {
        console.error("Related tracks error:", error);
        return [];
      }

      if (data?.success && data?.data) {
        const validResults = data.data
          .filter((track: YouTubeTrack) => track.videoId && isValidVideoId(track.videoId))
          .slice(0, 10);
        console.log("Related tracks found:", validResults.length);
        setRelatedTracks(validResults);
        return validResults;
      }

      return [];
    } catch (error) {
      console.error("Related tracks error:", error);
      return [];
    } finally {
      setIsLoadingRelated(false);
    }
  }, [handleAuthError]);

  const clearRelated = useCallback(() => {
    setRelatedTracks([]);
  }, []);

  const [trendingTracks, setTrendingTracks] = useState<YouTubeTrack[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [newReleaseTracks, setNewReleaseTracks] = useState<YouTubeTrack[]>([]);
  const [isLoadingNewReleases, setIsLoadingNewReleases] = useState(false);

  const fetchRecommendedTracks = useCallback(async () => {
    setIsLoadingRecommended(true);
    setRequiresAuth(false);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "search", query: "top hits 2025" },
      });

      if (handleAuthError(data, error)) return [];
      if (error) { console.error("Recommended tracks error:", error); return []; }

      if (data?.success && data?.data) {
        const validResults = data.data
          .filter((track: YouTubeTrack) => track.videoId && isValidVideoId(track.videoId))
          .slice(0, 12);
        setRecommendedTracks(validResults);
        setCachedRecommended(validResults);
        return validResults;
      }
      return [];
    } catch (error) {
      console.error("Recommended tracks error:", error);
      return [];
    } finally {
      setIsLoadingRecommended(false);
    }
  }, [handleAuthError]);

  const fetchTrendingTracks = useCallback(async () => {
    setIsLoadingTrending(true);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "search", query: "trending music 2025" },
      });

      if (handleAuthError(data, error)) return [];
      if (error) { console.error("Trending tracks error:", error); return []; }

      if (data?.success && data?.data) {
        const validResults = data.data
          .filter((track: YouTubeTrack) => track.videoId && isValidVideoId(track.videoId))
          .slice(0, 12);
        setTrendingTracks(validResults);
        return validResults;
      }
      return [];
    } catch (error) {
      console.error("Trending tracks error:", error);
      return [];
    } finally {
      setIsLoadingTrending(false);
    }
  }, [handleAuthError]);

  const fetchNewReleases = useCallback(async () => {
    setIsLoadingNewReleases(true);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "search", query: "new music releases 2025" },
      });

      if (handleAuthError(data, error)) return [];
      if (error) { console.error("New releases error:", error); return []; }

      if (data?.success && data?.data) {
        const validResults = data.data
          .filter((track: YouTubeTrack) => track.videoId && isValidVideoId(track.videoId))
          .slice(0, 12);
        setNewReleaseTracks(validResults);
        return validResults;
      }
      return [];
    } catch (error) {
      console.error("New releases error:", error);
      return [];
    } finally {
      setIsLoadingNewReleases(false);
    }
  }, [handleAuthError]);

  // Backward compatibility getter
  const lyrics = lyricsData?.plainLyrics || null;

  return {
    isSearching,
    searchResults,
    searchTracks,
    clearSearch,
    lyrics,
    lyricsData,
    isLoadingLyrics,
    fetchLyrics,
    fetchSyncedLyrics,
    clearLyrics,
    relatedTracks,
    isLoadingRelated,
    fetchRelatedTracks,
    clearRelated,
    recommendedTracks,
    isLoadingRecommended,
    fetchRecommendedTracks,
    trendingTracks,
    isLoadingTrending,
    fetchTrendingTracks,
    newReleaseTracks,
    isLoadingNewReleases,
    fetchNewReleases,
    requiresAuth,
  };
}
