import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCachedLyrics, setCachedLyrics } from "@/hooks/useLyricsCache";

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
  const [recommendedTracks, setRecommendedTracks] = useState<YouTubeTrack[]>([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const { toast } = useToast();

  const searchTracks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return [];
    }

    setIsSearching(true);
    try {
      console.log("Searching for:", query);
      
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "search", query },
      });

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
  }, [toast]);

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
    try {
      // Search for related tracks based on artist name
      const query = `${artist} songs`;
      console.log("Fetching related tracks:", query);
      
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "search", query },
      });

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
  }, []);

  const clearRelated = useCallback(() => {
    setRelatedTracks([]);
  }, []);

  const fetchRecommendedTracks = useCallback(async () => {
    setIsLoadingRecommended(true);
    try {
      // Search for trending/popular music
      const queries = ["trending songs 2025", "popular music", "top hits"];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      console.log("Fetching recommended tracks:", randomQuery);
      
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "search", query: randomQuery },
      });

      if (error) {
        console.error("Recommended tracks error:", error);
        return [];
      }

      if (data?.success && data?.data) {
        const validResults = data.data
          .filter((track: YouTubeTrack) => track.videoId && isValidVideoId(track.videoId))
          .slice(0, 12);
        console.log("Recommended tracks found:", validResults.length);
        setRecommendedTracks(validResults);
        return validResults;
      }

      return [];
    } catch (error) {
      console.error("Recommended tracks error:", error);
      return [];
    } finally {
      setIsLoadingRecommended(false);
    }
  }, []);

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
  };
}
