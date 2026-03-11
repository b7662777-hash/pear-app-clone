import { useState, useEffect, lazy, Suspense } from "react";
import { SidebarShell } from "@/components/SidebarShell";
import { MobileSidebar } from "@/components/MobileSidebar";
import { SearchBar } from "@/components/SearchBar";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePlaylists, PlaylistSong, LikedSong } from "@/hooks/usePlaylists";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { Library as LibraryIcon, Heart, Clock, ListMusic, Plus, Music, Play, Trash2, MoreVertical, Pause } from "lucide-react";

// Lazy load components
const AmbientBackground = lazy(() => import("@/components/AmbientBackground").then((m) => ({ default: m.AmbientBackground })));
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const Library = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [showLikedSongs, setShowLikedSongs] = useState(location.pathname === '/library/liked');

  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const {
    playlists,
    likedSongs,
    isLoading,
    createPlaylist,
    deletePlaylist,
    getPlaylistSongs,
    removeFromPlaylist,
    unlikeSong
  } = usePlaylists();

  const { playTrack, currentTrack, isPlaying, playPause } = usePlayer();

  // Check URL for liked songs view
  useEffect(() => {
    if (location.pathname === '/library/liked') {
      setShowLikedSongs(true);
      setSelectedPlaylistId(null);
    }
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") navigate("/");
    if (tab === "explore") navigate("/explore");
    if (tab === "liked") {
      navigate("/library/liked");
      setShowLikedSongs(true);
      setSelectedPlaylistId(null);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName("");
    setShowCreatePlaylist(false);
  };

  const handlePlaylistClick = async (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setShowLikedSongs(false);
    const songs = await getPlaylistSongs(playlistId);
    setPlaylistSongs(songs);
  };

  const handleLikedSongsClick = () => {
    setShowLikedSongs(true);
    setSelectedPlaylistId(null);
    navigate("/library/liked");
  };

  const handleBackToLibrary = () => {
    setSelectedPlaylistId(null);
    setShowLikedSongs(false);
    setPlaylistSongs([]);
    navigate("/library");
  };

  // Convert song to Track format for player
  const songToTrack = (song: PlaylistSong | LikedSong): Track => ({
    id: song.video_id,
    title: song.title,
    artist: song.artist,
    album: song.album || '',
    plays: '',
    image: song.thumbnail || '',
    duration: parseDuration(song.duration || '0:00'),
    videoId: song.video_id
  });

  const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 0;
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const handlePlaySong = (song: PlaylistSong | LikedSong, allSongs: (PlaylistSong | LikedSong)[]) => {
    const track = songToTrack(song);
    const queue = allSongs.map(songToTrack);
    playTrack(track, queue);
  };

  const handlePlayAll = (songs: (PlaylistSong | LikedSong)[]) => {
    if (songs.length === 0) return;
    handlePlaySong(songs[0], songs);
  };

  const isCurrentlyPlaying = (song: PlaylistSong | LikedSong) => {
    return currentTrack?.videoId === song.video_id && isPlaying;
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  // Playlist Detail View
  if (selectedPlaylistId && selectedPlaylist) {
    return (
      <div className="flex w-screen h-[100dvh] bg-background overflow-hidden relative">
        {/* Global Ambient Background */}
        <Suspense fallback={null}>
          <AmbientBackground />
        </Suspense>

        <SidebarShell activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <main className="flex-1 overflow-y-auto px-4 md:px-6 pb-24">
            {/* Header */}
            <div className="mb-8 animate-fade-in-up">
              <button
                onClick={handleBackToLibrary}
                className="text-muted-foreground hover:text-foreground mb-4 text-sm transition-colors">

                ← Back to Library
              </button>
              <div className="flex items-center gap-6">
                <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl hover-scale-smooth">
                  <ListMusic className="w-20 h-20 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Playlist</p>
                  <h1 className="text-4xl font-bold mb-2">{selectedPlaylist.name}</h1>
                  <p className="text-muted-foreground mb-4">{playlistSongs.length} songs</p>
                  {playlistSongs.length > 0 &&
                  <Button
                    onClick={() => handlePlayAll(playlistSongs)}
                    className="rounded-full px-8 gap-2 bg-primary hover:bg-primary/90 hover-scale-smooth">

                      <Play className="w-5 h-5 fill-current" />
                      Play All
                    </Button>
                  }
                </div>
              </div>
            </div>

            {/* Songs List */}
            {playlistSongs.length === 0 ?
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in-scale">
                <Music className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No songs in this playlist yet</p>
              </div> :

            <div className="space-y-1 stagger-children">
                {playlistSongs.map((song, index) =>
              <div
                key={song.id}
                onClick={() => handlePlaySong(song, playlistSongs)}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer group",
                  isCurrentlyPlaying(song) && "bg-accent/70"
                )}>

                    <div className="w-8 flex items-center justify-center">
                      {isCurrentlyPlaying(song) ?
                  <div className="w-4 h-4 flex items-center justify-center">
                          <div className="flex gap-0.5">
                            <span className="w-1 h-3 bg-primary animate-pulse rounded-full" />
                            <span className="w-1 h-4 bg-primary animate-pulse rounded-full animation-delay-100" />
                            <span className="w-1 h-2 bg-primary animate-pulse rounded-full animation-delay-200" />
                          </div>
                        </div> :

                  <span className="text-sm text-muted-foreground group-hover:hidden">
                          {index + 1}
                        </span>
                  }
                      <Play className="w-4 h-4 hidden group-hover:block text-foreground" />
                    </div>
                    {song.thumbnail ?
                <img src={song.thumbnail} alt={song.title} className="w-12 h-12 rounded object-cover" /> :

                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Music className="w-6 h-6 text-muted-foreground" />
                      </div>
                }
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium truncate", isCurrentlyPlaying(song) && "text-primary")}>{song.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{song.duration || '--:--'}</span>
                    <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromPlaylist(selectedPlaylistId, song.video_id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/20 rounded transition-all">

                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
              )}
              </div>
            }
          </main>
        </div>

      </div>);

  }

  // Liked Songs View
  if (showLikedSongs) {
    return (
      <div className="flex w-screen h-[100dvh] bg-background overflow-hidden relative">
        {/* Global Ambient Background */}
        <Suspense fallback={null}>
          <AmbientBackground />
        </Suspense>

        <SidebarShell activeTab="liked" onTabChange={handleTabChange} />

        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <main className="flex-1 overflow-y-auto px-4 md:px-6 pb-24">
            {/* Header */}
            <div className="mb-8 animate-fade-in-up">
              <button
                onClick={handleBackToLibrary}
                className="text-muted-foreground hover:text-foreground mb-4 text-sm transition-colors">

                ← Back to Library
              </button>
              <div className="flex items-center gap-6">
                <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-2xl hover-scale-smooth">
                  <Heart className="w-20 h-20 text-white fill-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Playlist</p>
                  <h1 className="text-4xl font-bold mb-2">Liked Songs</h1>
                  <p className="text-muted-foreground mb-4">{likedSongs.length} songs</p>
                  {likedSongs.length > 0 &&
                  <Button
                    onClick={() => handlePlayAll(likedSongs)}
                    className="rounded-full px-8 gap-2 bg-primary hover:bg-primary/90 hover-scale-smooth">

                      <Play className="w-5 h-5 fill-current" />
                      Play All
                    </Button>
                  }
                </div>
              </div>
            </div>

            {/* Songs List */}
            {likedSongs.length === 0 ?
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in-scale">
                <Heart className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Songs you like will appear here</p>
              </div> :

            <div className="space-y-1 stagger-children">
                {likedSongs.map((song, index) =>
              <div
                key={song.id}
                onClick={() => handlePlaySong(song, likedSongs)}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer group",
                  isCurrentlyPlaying(song) && "bg-accent/70"
                )}>

                    <div className="w-8 flex items-center justify-center">
                      {isCurrentlyPlaying(song) ?
                  <div className="w-4 h-4 flex items-center justify-center">
                          <div className="flex gap-0.5">
                            <span className="w-1 h-3 bg-primary animate-pulse rounded-full" />
                            <span className="w-1 h-4 bg-primary animate-pulse rounded-full animation-delay-100" />
                            <span className="w-1 h-2 bg-primary animate-pulse rounded-full animation-delay-200" />
                          </div>
                        </div> :

                  <span className="text-sm text-muted-foreground group-hover:hidden">
                          {index + 1}
                        </span>
                  }
                      <Play className="w-4 h-4 hidden group-hover:block text-foreground" />
                    </div>
                    {song.thumbnail ?
                <img src={song.thumbnail} alt={song.title} className="w-12 h-12 rounded object-cover" /> :

                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Music className="w-6 h-6 text-muted-foreground" />
                      </div>
                }
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium truncate", isCurrentlyPlaying(song) && "text-primary")}>{song.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{song.duration || '--:--'}</span>
                    <button
                  onClick={(e) => {
                    e.stopPropagation();
                    unlikeSong(song.video_id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/20 rounded transition-all">

                      <Heart className="w-4 h-4 text-destructive fill-destructive" />
                    </button>
                  </div>
              )}
              </div>
            }
          </main>
        </div>

      </div>);

  }

  return (
    <div className="flex w-screen h-[100dvh] bg-background overflow-hidden relative">
      {/* Global Ambient Background */}
      <Suspense fallback={null}>
        <AmbientBackground />
      </Suspense>

      <SidebarShell activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <main className="flex-1 overflow-y-auto px-4 md:px-6 pb-24">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2 px-[475px]">
              <LibraryIcon className="text-primary px-0 w-[1024px] h-[32px]" />
              <h1 className="text-3xl font-bold">Your Library</h1>
            </div>
            <p className="text-muted-foreground px-[450px]">Your music collection</p>
          </div>

          {!user && !loading ? (
          /* Not signed in state */
          <div className="items-center justify-center py-20 animate-fade-in-scale gap-0 flex flex-col pl-[125px] px-[12px]">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <Music className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Sign in to see your library</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create playlists, save songs, and see your listening history
              </p>
              <Button onClick={() => navigate("/auth")} className="rounded-full px-8 hover-scale-smooth">
                Sign in
              </Button>
            </div>) :

          <>
              {/* Quick Access */}
              <section className="mb-10 animate-fade-in-up animation-delay-100">
                <h2 className="text-xl font-semibold mb-4 px-0">   Quick Access</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Liked Songs */}
                  <div
                  onClick={handleLikedSongsClick}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-all duration-300 cursor-pointer hover-lift group">

                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                      <Heart className="w-7 h-7 text-white fill-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Liked Songs</h3>
                      <p className="text-sm text-muted-foreground">{likedSongs.length} songs</p>
                    </div>
                    <Play className="w-10 h-10 p-2 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-all shadow-lg" />
                  </div>
                  
                  {/* Recently Played */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-all duration-300 cursor-pointer hover-lift">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-lg">
                      <Clock className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Recently Played</h3>
                      <p className="text-sm text-muted-foreground">0 songs</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Playlists */}
              <section className="mb-10 animate-fade-in-up animation-delay-200">
                <div className="mb-4 flex items-center justify-between px-0">
                  <h2 className="text-xl font-semibold">   Playlists</h2>
                  <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover-scale-smooth"
                  onClick={() => setShowCreatePlaylist(true)}>

                    <Plus className="w-4 h-4" />
                    Create Playlist
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 stagger-children">
                  {/* User Playlists */}
                  {playlists.map((playlist) =>
                <div
                  key={playlist.id}
                  onClick={() => handlePlaylistClick(playlist.id)}
                  className="group relative aspect-square rounded-xl bg-card border border-border overflow-hidden cursor-pointer hover-lift">

                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <ListMusic className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-semibold text-white truncate">{playlist.name}</p>
                        <p className="text-xs text-white/70">{playlist.song_count || 0} songs</p>
                      </div>
                      {/* Play button on hover */}
                      <div className="absolute bottom-14 right-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                        <button
                      className="p-3 bg-primary rounded-full shadow-xl hover:scale-105 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaylistClick(playlist.id);
                      }}>

                          <Play className="w-5 h-5 text-primary-foreground fill-current" />
                        </button>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                          className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                          onClick={(e) => e.stopPropagation()}>

                              <MoreVertical className="w-4 h-4 text-white" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePlaylist(playlist.id);
                          }}>

                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Playlist
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                )}
                  
                  {/* Create new playlist card */}
                  <div
                  onClick={() => setShowCreatePlaylist(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all duration-300">

                    <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">        Create New Playlist</span>
                  </div>
                </div>
              </section>

              {/* Artists */}
              <section className="mb-10 animate-fade-in-up animation-delay-300">
                <h2 className="text-xl font-semibold mb-4">    Artists</h2>
                <div className="w-full rounded-xl bg-card/30 border border-border/50 flex items-center justify-center py-16 text-muted-foreground px-0">
                  <p>Artists you follow will appear here </p>
                </div>
              </section>

              {/* Albums */}
              <section className="mb-10 animate-fade-in-up animation-delay-400">
                <h2 className="text-xl font-semibold mb-4">     Albums</h2>
                <div className="w-full rounded-xl bg-card/30 border border-border/50 flex items-center justify-center py-16 text-muted-foreground">
                  <p>Albums you save will appear here</p>
                </div>
              </section>
            </>
          }
        </main>
      </div>


      {/* Create Playlist Dialog */}
      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent className="bg-card border-border max-w-sm animate-fade-in-scale">
          <DialogHeader>
            <DialogTitle>Create new playlist</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Playlist name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="bg-background border-border"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreatePlaylist();
            }} />

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowCreatePlaylist(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()} className="hover-scale-smooth">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default Library;