import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  song_count?: number;
}

export interface PlaylistSong {
  id: string;
  video_id: string;
  title: string;
  artist: string;
  album: string | null;
  thumbnail: string | null;
  duration: string | null;
  added_at: string;
  position: number;
}

export interface LikedSong {
  id: string;
  video_id: string;
  title: string;
  artist: string;
  album: string | null;
  thumbnail: string | null;
  duration: string | null;
  liked_at: string;
}

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's playlists
  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get song counts for each playlist
      const playlistsWithCounts = await Promise.all(
        (data || []).map(async (playlist) => {
          const { count } = await supabase
            .from('playlist_songs')
            .select('*', { count: 'exact', head: true })
            .eq('playlist_id', playlist.id);
          
          return { ...playlist, song_count: count || 0 };
        })
      );
      
      setPlaylists(playlistsWithCounts);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch liked songs
  const fetchLikedSongs = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('liked_songs')
        .select('*')
        .order('liked_at', { ascending: false });

      if (error) throw error;
      setLikedSongs(data || []);
    } catch (error) {
      console.error('Error fetching liked songs:', error);
    }
  }, [user]);

  // Create a new playlist
  const createPlaylist = useCallback(async (name: string, description?: string) => {
    if (!user) {
      toast.error('Please sign in to create playlists');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Playlist created!');
      await fetchPlaylists();
      return data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
      return null;
    }
  }, [user, fetchPlaylists]);

  // Delete a playlist
  const deletePlaylist = useCallback(async (playlistId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;
      
      toast.success('Playlist deleted');
      await fetchPlaylists();
      return true;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist');
      return false;
    }
  }, [user, fetchPlaylists]);

  // Add song to playlist
  const addToPlaylist = useCallback(async (
    playlistId: string,
    song: {
      videoId: string;
      title: string;
      artist: string;
      album?: string;
      thumbnail?: string;
      duration?: string;
    }
  ) => {
    if (!user) {
      toast.error('Please sign in to add songs');
      return false;
    }

    try {
      // Get current max position
      const { data: existing } = await supabase
        .from('playlist_songs')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          video_id: song.videoId,
          title: song.title,
          artist: song.artist,
          album: song.album || null,
          thumbnail: song.thumbnail || null,
          duration: song.duration || null,
          position: nextPosition,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Song already in playlist');
          return false;
        }
        throw error;
      }
      
      toast.success('Added to playlist!');
      await fetchPlaylists();
      return true;
    } catch (error) {
      console.error('Error adding to playlist:', error);
      toast.error('Failed to add song');
      return false;
    }
  }, [user, fetchPlaylists]);

  // Remove song from playlist
  const removeFromPlaylist = useCallback(async (playlistId: string, videoId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('video_id', videoId);

      if (error) throw error;
      
      toast.success('Removed from playlist');
      await fetchPlaylists();
      return true;
    } catch (error) {
      console.error('Error removing from playlist:', error);
      toast.error('Failed to remove song');
      return false;
    }
  }, [user, fetchPlaylists]);

  // Get songs in a playlist
  const getPlaylistSongs = useCallback(async (playlistId: string): Promise<PlaylistSong[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('playlist_songs')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching playlist songs:', error);
      return [];
    }
  }, [user]);

  // Like a song
  const likeSong = useCallback(async (song: {
    videoId: string;
    title: string;
    artist: string;
    album?: string;
    thumbnail?: string;
    duration?: string;
  }) => {
    if (!user) {
      toast.error('Please sign in to like songs');
      return false;
    }

    try {
      const { error } = await supabase
        .from('liked_songs')
        .insert({
          user_id: user.id,
          video_id: song.videoId,
          title: song.title,
          artist: song.artist,
          album: song.album || null,
          thumbnail: song.thumbnail || null,
          duration: song.duration || null,
        });

      if (error) {
        if (error.code === '23505') {
          // Already liked, so unlike it
          return await unlikeSong(song.videoId);
        }
        throw error;
      }
      
      toast.success('Added to Liked Songs');
      await fetchLikedSongs();
      return true;
    } catch (error) {
      console.error('Error liking song:', error);
      toast.error('Failed to like song');
      return false;
    }
  }, [user, fetchLikedSongs]);

  // Unlike a song
  const unlikeSong = useCallback(async (videoId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('liked_songs')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) throw error;
      
      toast.success('Removed from Liked Songs');
      await fetchLikedSongs();
      return true;
    } catch (error) {
      console.error('Error unliking song:', error);
      return false;
    }
  }, [user, fetchLikedSongs]);

  // Check if a song is liked
  const isLiked = useCallback((videoId: string) => {
    return likedSongs.some(song => song.video_id === videoId);
  }, [likedSongs]);

  // Toggle like
  const toggleLike = useCallback(async (song: {
    videoId: string;
    title: string;
    artist: string;
    album?: string;
    thumbnail?: string;
    duration?: string;
  }) => {
    if (isLiked(song.videoId)) {
      return await unlikeSong(song.videoId);
    } else {
      return await likeSong(song);
    }
  }, [isLiked, likeSong, unlikeSong]);

  // Fetch on mount and user change
  useEffect(() => {
    if (user) {
      fetchPlaylists();
      fetchLikedSongs();
    } else {
      setPlaylists([]);
      setLikedSongs([]);
    }
  }, [user, fetchPlaylists, fetchLikedSongs]);

  return {
    playlists,
    likedSongs,
    isLoading,
    fetchPlaylists,
    fetchLikedSongs,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getPlaylistSongs,
    likeSong,
    unlikeSong,
    isLiked,
    toggleLike,
  };
}
