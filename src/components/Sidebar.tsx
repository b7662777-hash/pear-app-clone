import { Home, Compass, Library, Youtube, Plus, Heart, Clock, ListMusic, User, Sparkles } from "lucide-react";
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
  { id: "upgrade", label: "Upgrade", icon: Sparkles, path: null },
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
    <aside className="w-60 h-full bg-black/10 backdrop-blur-xl flex flex-col border-r border-white/5">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
          <Youtube className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-medium text-foreground">Music</span>
      </div>

      {/* Main Navigation */}
      <nav className="px-2 space-y-0.5">
        {mainNavItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => item.path ? handleNavClick(item as typeof mainNavItems[0]) : null} 
            className={cn(
              "nav-item w-full transition-all duration-200 rounded-full",
              isActive(item.id) && "active bg-accent",
              !item.path && "opacity-80"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="my-4 mx-4 h-px bg-border" />

      {/* New Playlist Button */}
      <div className="px-3 mb-4">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full border border-border/50 text-sm font-medium text-foreground hover:bg-accent transition-colors">
          <Plus className="w-5 h-5" />
          <span>New playlist</span>
        </button>
      </div>

      {/* Library Section */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {/* Liked music */}
          <button 
            onClick={() => handlePlaylistClick('liked')} 
            className={cn(
              "w-full flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left",
              isActive('liked') && "bg-accent"
            )}
          >
            <div className="w-10 h-10 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block truncate">Liked music</span>
              <span className="text-xs text-muted-foreground">Auto playlist</span>
            </div>
          </button>

          {/* Episodes for later */}
          <button 
            onClick={() => handlePlaylistClick('recent')} 
            className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
          >
            <div className="w-10 h-10 rounded bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block truncate">Episodes for later</span>
              <span className="text-xs text-muted-foreground">Auto playlist</span>
            </div>
          </button>

          {/* User Playlists */}
          {playlists.map(playlist => (
            <button 
              key={playlist.id}
              onClick={() => navigate('/library')} 
              className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <div className="w-10 h-10 rounded bg-card flex items-center justify-center flex-shrink-0">
                <ListMusic className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground block truncate">{playlist.name}</span>
                <span className="text-xs text-muted-foreground">{playlist.song_count || 0} songs</span>
              </div>
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
