import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export function useYouTubeMusic() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<YouTubeTrack[]>([]);
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

  const fetchSyncedLyrics = useCallback(async (
    title: string, 
    artist: string, 
    provider: LyricsProvider = "lrclib",
    videoId?: string
  ) => {
    setIsLoadingLyrics(true);
    setLyricsData(null);
    
    try {
      console.log("Fetching synced lyrics for:", title, "by", artist, "from", provider);
      
      const { data, error } = await supabase.functions.invoke("youtube-music", {
        body: { action: "synced-lyrics", title, artist, provider, videoId },
      });

      if (error) {
        console.error("Synced lyrics error:", error);
        return null;
      }

      if (data?.success && data?.data) {
        console.log("Lyrics found, synced:", data.data.synced, "source:", data.data.source);
        setLyricsData(data.data);
        return data.data;
      }

      console.log("No lyrics available");
      return null;
    } catch (error) {
      console.error("Synced lyrics error:", error);
      return null;
    } finally {
      setIsLoadingLyrics(false);
    }
  }, []);

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
  };
}
