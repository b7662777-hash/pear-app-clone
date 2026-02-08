import { Home, Compass, Library, Youtube, Plus, Heart, Clock, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { lazy, Suspense } from "react";

// Lazy load auth-dependent components to defer Supabase bundle loading
const SidebarUserSection = lazy(() => import("./SidebarUserSection"));
const SidebarPlaylists = lazy(() => import("./SidebarPlaylists"));

interface SidebarShellProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const mainNavItems = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "explore", label: "Explore", icon: Compass, path: "/explore" },
  { id: "library", label: "Library", icon: Library, path: "/library" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

// Note: "Upgrade" would go here in a premium version

export function SidebarShell({ activeTab, onTabChange }: SidebarShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

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

      {/* Library Section - static items first, then lazy loaded playlists */}
      <div className="flex-1 overflow-y-auto px-3 hide-scrollbar">
        <div className="space-y-1">
          {/* Liked music - static, no auth needed for UI */}
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

          {/* User Playlists - lazy loaded */}
          <Suspense fallback={null}>
            <SidebarPlaylists />
          </Suspense>
        </div>
      </div>

      {/* User Section - lazy loaded to defer Supabase */}
      <Suspense fallback={
        <div className="p-4 m-3 rounded-xl bg-[#1a1a1a]">
          <div className="animate-shimmer h-10 rounded" />
        </div>
      }>
        <SidebarUserSection />
      </Suspense>
    </aside>
  );
}

export default SidebarShell;
