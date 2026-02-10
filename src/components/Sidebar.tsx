import { Home, Compass, Library, Sparkles, Plus, Heart, Clock, ListMusic, User, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

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
  const { playlists } = usePlaylists();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavClick = (item: typeof mainNavItems[0]) => {
    if (item.path) {
      onTabChange(item.id);
      navigate(item.path);
    }
  };

  const handlePlaylistClick = (type: 'liked' | 'recent' | string) => {
    if (type === 'liked') {
      onTabChange('liked');
      navigate('/library/liked');
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
    <aside className={cn(
      "h-full flex flex-col bg-[#0f0f0f] transition-all duration-200 relative z-20",
      isCollapsed ? "w-[72px]" : "w-[240px]"
    )}>
      {/* Logo with hamburger */}
      <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-full hover:bg-white/[0.08] transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-white/80" />
        </button>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-red-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228 18.228 15.432 18.228 12 15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
              </svg>
            </div>
            <span className="text-lg font-medium text-white">Music</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="px-2 space-y-0.5">
        {mainNavItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => handleNavClick(item)} 
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive(item.id) 
                ? "bg-white/[0.1] text-white" 
                : "text-white/70 hover:text-white hover:bg-white/[0.05]",
              !item.path && "opacity-60"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* New Playlist Button */}
      {!isCollapsed && (
        <div className="px-3 mt-6">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-white/20 hover:bg-white/[0.05] text-sm font-medium text-white/90 transition-colors">
            <Plus className="w-5 h-5" />
            <span>New playlist</span>
          </button>
        </div>
      )}

      {/* Library Section */}
      <div className="flex-1 overflow-y-auto px-2 mt-4 hide-scrollbar">
        <div className="space-y-0.5">
          {/* Liked music */}
          <button 
            onClick={() => handlePlaylistClick('liked')} 
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left",
              isActive('liked') && "bg-white/[0.1]"
            )}
          >
            <div className="w-10 h-10 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white block truncate">Liked music</span>
                <span className="text-xs text-white/50 flex items-center gap-1">
                  <span className="text-yellow-400">★</span> Auto playlist
                </span>
              </div>
            )}
          </button>

          {/* User Playlists */}
          {!isCollapsed && playlists.map(playlist => (
            <button 
              key={playlist.id}
              onClick={() => navigate('/library')} 
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center flex-shrink-0">
                <ListMusic className="w-4 h-4 text-white/50" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white block truncate">{playlist.name}</span>
                <span className="text-xs text-white/50">{playlist.song_count || 0} songs</span>
              </div>
            </button>
          ))}

          {/* Episodes for later */}
          <button 
            onClick={() => handlePlaylistClick('recent')} 
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white block truncate">Episodes for later</span>
                <span className="text-xs text-white/50">Auto playlist</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}