import { Home, Compass, Library, Youtube, Plus, Heart, Clock, ListMusic, User, Settings } from "lucide-react";
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
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading } = useAuth();
  const { playlists } = usePlaylists();

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
    <aside className="w-60 h-full flex flex-col bg-[#0f0f0f] border-r border-white/[0.08]">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-glow">
          <Youtube className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-foreground">Music</span>
      </div>

      {/* Main Navigation */}
      <nav className="px-3 space-y-1">
        {mainNavItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => item.path ? handleNavClick(item as typeof mainNavItems[0]) : null} 
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              isActive(item.id) 
                ? "bg-white/[0.12] text-white" 
                : "text-white/60 hover:text-white hover:bg-white/[0.08]",
              !item.path && "opacity-80"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="my-4 mx-4 h-px bg-white/[0.08]" />

      {/* New Playlist Button */}
      <div className="px-3 mb-4">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a1a1a] hover:bg-[#222] text-sm font-medium text-white/80 hover:text-white transition-all duration-200">
          <Plus className="w-5 h-5" />
          <span>New playlist</span>
        </button>
      </div>

      {/* Library Section */}
      <div className="flex-1 overflow-y-auto px-3 hide-scrollbar">
        <div className="space-y-1">
          {/* Liked music */}
          <button 
            onClick={() => handlePlaylistClick('liked')} 
            className={cn(
              "w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.08] transition-all duration-200 text-left group",
              isActive('liked') && "bg-white/[0.12]"
            )}
          >
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
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
            className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.08] transition-all duration-200 text-left group"
          >
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg">
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
              className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.08] transition-all duration-200 text-left group"
            >
              <div className="w-11 h-11 rounded-lg bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                <ListMusic className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
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
        <div className="p-4 m-3 rounded-xl bg-[#1a1a1a]">
          <div className="animate-shimmer h-10 rounded" />
        </div>
      ) : user ? (
        <div 
          className="p-4 m-3 rounded-xl bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-colors" 
          onClick={() => navigate('/profile')}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-white/[0.1]">
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
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
        <div className="p-4 m-3 rounded-xl bg-[#1a1a1a]">
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to create playlists and save songs
          </p>
          <button 
            onClick={() => navigate('/auth')} 
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.1] hover:bg-white/[0.15] text-sm font-medium text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Sign in
          </button>
        </div>
      )}
    </aside>
  );
}
