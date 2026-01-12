import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Music, ListMusic, Heart } from 'lucide-react';
import { usePlaylists, Playlist } from '@/hooks/usePlaylists';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AddToPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: {
    videoId: string;
    title: string;
    artist: string;
    album?: string;
    thumbnail?: string;
    duration?: string;
  } | null;
}

export function AddToPlaylistDialog({ isOpen, onClose, song }: AddToPlaylistDialogProps) {
  const { user } = useAuth();
  const { playlists, createPlaylist, addToPlaylist, likeSong, isLiked } = usePlaylists();
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleAddToPlaylist = async (playlist: Playlist) => {
    if (!song) return;
    
    await addToPlaylist(playlist.id, song);
    onClose();
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim() || !song) return;
    
    setIsCreating(true);
    const newPlaylist = await createPlaylist(newPlaylistName.trim());
    
    if (newPlaylist) {
      await addToPlaylist(newPlaylist.id, song);
      setNewPlaylistName('');
      setShowNewPlaylist(false);
      onClose();
    }
    setIsCreating(false);
  };

  const handleLikeSong = async () => {
    if (!song) return;
    await likeSong(song);
    onClose();
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Sign in required</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Please sign in to save songs to your playlists.
          </p>
          <Button onClick={() => window.location.href = '/auth'} className="w-full mt-4">
            Sign In
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm animate-fade-in-scale">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <ListMusic className="w-5 h-5" />
            Add to playlist
          </DialogTitle>
        </DialogHeader>

        {song && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 mb-4">
            {song.thumbnail ? (
              <img 
                src={song.thumbnail} 
                alt={song.title}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                <Music className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
              <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-[300px]">
          <div className="space-y-1">
            {/* Like Song Option */}
            <button
              onClick={handleLikeSong}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent group",
                song && isLiked(song.videoId) && "bg-primary/10"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                song && isLiked(song.videoId) 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-gradient-to-br from-pink-500 to-rose-600"
              )}>
                <Heart className={cn("w-5 h-5", song && isLiked(song.videoId) && "fill-current")} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Liked Songs</p>
                <p className="text-xs text-muted-foreground">
                  {song && isLiked(song.videoId) ? 'Already liked' : 'Add to your liked songs'}
                </p>
              </div>
            </button>

            {/* Existing Playlists */}
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist)}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <ListMusic className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-foreground">{playlist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {playlist.song_count || 0} songs
                  </p>
                </div>
              </button>
            ))}

            {/* Create New Playlist */}
            {showNewPlaylist ? (
              <div className="p-3 rounded-lg bg-secondary/50 space-y-3 animate-fade-in">
                <Input
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-background border-border"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateAndAdd();
                    if (e.key === 'Escape') setShowNewPlaylist(false);
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewPlaylist(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateAndAdd}
                    disabled={!newPlaylistName.trim() || isCreating}
                    className="flex-1"
                  >
                    {isCreating ? 'Creating...' : 'Create & Add'}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewPlaylist(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent group"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-foreground">Create new playlist</p>
              </button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
