import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface YouTubeTrack {
  videoId: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  thumbnail: string;
}

export function useYouTubeMusic() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<YouTubeTrack[]>([]);
  const [lyrics, setLyrics] = useState<string | null>(null);
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
        console.log("Search results:", data.data.length);
        setSearchResults(data.data);
        return data.data;
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

  const fetchLyrics = useCallback(async (videoId: string) => {
    setIsLoadingLyrics(true);
    setLyrics(null);
    
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
        setLyrics(data.data);
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
    setLyrics(null);
  }, []);

  return {
    isSearching,
    searchResults,
    searchTracks,
    clearSearch,
    lyrics,
    isLoadingLyrics,
    fetchLyrics,
    clearLyrics,
  };
}
