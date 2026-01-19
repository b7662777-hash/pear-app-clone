import { Home, Compass, Library, Music2, Plus, Heart, Clock, ListMusic, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const mainNavItems = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "explore", label: "Explore", icon: Compass, path: "/explore" },
  { id: "library", label: "Library", icon: Library, path: "/library" },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const { playlists, likedSongs } = usePlaylists();

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleNavClick = (item: typeof mainNavItems[0]) => {
    onTabChange(item.id);
    navigate(item.path);
  };

  const handlePlaylistClick = (type: 'liked' | 'recent' | string) => {
    if (type === 'liked') {
      onTabChange('liked');
      navigate('/library/liked');
    } else if (type === 'recent') {
      onTabChange('library');
      navigate('/library');
    } else {
      // Handle custom playlist
      onTabChange('library');
      navigate('/library');
    }
  };

  const isActive = (id: string) => {
    if (id === 'liked') return location.pathname === '/library/liked';
    if (id === 'library') return location.pathname === '/library' && activeTab === 'library';
    return activeTab === id;
  };

  return (
    <aside className="w-60 h-full bg-background/80 backdrop-blur-xl flex flex-col border-r border-border/30">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Music2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Pear Music</span>
      </div>

      {/* Main Navigation */}
      <nav className="px-3 space-y-1">
        {mainNavItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => handleNavClick(item)} 
            className={cn(
              "nav-item w-full transition-all duration-200",
              isActive(item.id) && "active bg-accent"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="my-4 mx-4 h-px bg-border" />

      {/* Library Section */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Library
          </span>
          <button className="p-1 rounded-full hover:bg-accent transition-colors" aria-label="Create new playlist">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-1">
          {/* Liked Songs - Always visible */}
          <button 
            onClick={() => handlePlaylistClick('liked')} 
            className={cn(
              "nav-item w-full transition-all duration-200",
              isActive('liked') && "active bg-accent"
            )}
          >
            <Heart className="w-5 h-5 text-primary" />
            <span className="text-sm truncate flex-1 text-left">Liked Songs</span>
            <span className="text-xs text-muted-foreground">{likedSongs.length}</span>
          </button>

          {/* Recently Played */}
          <button 
            onClick={() => handlePlaylistClick('recent')} 
            className="nav-item w-full transition-all duration-200"
          >
            <Clock className="w-5 h-5" />
            <span className="text-sm truncate">Recently Played</span>
          </button>

          {/* User Playlists */}
          {playlists.map(playlist => (
            <button 
              key={playlist.id}
              onClick={() => navigate('/library')} 
              className="nav-item w-full transition-all duration-200"
            >
              <ListMusic className="w-5 h-5" />
              <span className="text-sm truncate flex-1 text-left">{playlist.name}</span>
              <span className="text-xs text-muted-foreground">{playlist.song_count || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User Section */}
      {loading ? (
        <div className="p-4 m-3 rounded-lg bg-card border border-border/50">
          <div className="animate-pulse h-10 bg-muted rounded" />
        </div>
      ) : user ? (
        <div className="p-4 m-3 rounded-lg bg-card border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 m-3 rounded-lg bg-card border border-border/50">
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to create playlists and save songs
          </p>
          <button 
            onClick={() => navigate('/auth')} 
            className="w-full py-2 px-4 rounded-full border border-muted-foreground/50 text-sm font-medium text-foreground hover:border-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2 hover-scale-smooth"
          >
            <User className="w-4 h-4" />
            Sign in
          </button>
        </div>
      )}
    </aside>
  );
}
