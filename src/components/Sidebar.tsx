import { Home, Compass, Library, Music2, Plus, Heart, Clock, ListMusic } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const mainNavItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "library", label: "Library", icon: Library },
];

const playlists = [
  { id: "liked", label: "Liked Music", icon: Heart },
  { id: "recent", label: "Recently Played", icon: Clock },
  { id: "playlist1", label: "Chill Vibes", icon: ListMusic },
  { id: "playlist2", label: "Workout Mix", icon: ListMusic },
  { id: "playlist3", label: "Focus Mode", icon: ListMusic },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-60 h-full bg-background flex flex-col border-r border-border/50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Music2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Music</span>
      </div>

      {/* Main Navigation */}
      <nav className="px-3 space-y-1">
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "nav-item w-full",
              activeTab === item.id && "active bg-accent"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="my-4 mx-4 h-px bg-border" />

      {/* Playlists Section */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Library
          </span>
          <button className="p-1 rounded-full hover:bg-accent transition-colors">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-1">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onTabChange(playlist.id)}
              className={cn(
                "nav-item w-full",
                activeTab === playlist.id && "active bg-accent"
              )}
            >
              <playlist.icon className={cn(
                "w-5 h-5",
                playlist.id === "liked" && "text-primary"
              )} />
              <span className="text-sm truncate">{playlist.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sign In Prompt */}
      <div className="p-4 m-3 rounded-lg bg-card border border-border/50">
        <p className="text-sm text-muted-foreground mb-3">
          Sign in to create playlists and get personalized recommendations
        </p>
        <button className="w-full py-2 px-4 rounded-full border border-muted-foreground/50 text-sm font-medium text-foreground hover:border-foreground transition-colors">
          Sign in
        </button>
      </div>
    </aside>
  );
}
