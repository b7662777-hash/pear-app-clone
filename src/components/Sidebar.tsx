import { Home, Compass, Library, Music2, Plus, Heart, Clock, ListMusic, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
const mainNavItems = [{
  id: "home",
  label: "Home",
  icon: Home
}, {
  id: "explore",
  label: "Explore",
  icon: Compass
}, {
  id: "library",
  label: "Library",
  icon: Library
}];
const playlists = [{
  id: "liked",
  label: "Liked Music",
  icon: Heart
}, {
  id: "recent",
  label: "Recently Played",
  icon: Clock
}, {
  id: "playlist1",
  label: "Chill Vibes",
  icon: ListMusic
}, {
  id: "playlist2",
  label: "Workout Mix",
  icon: ListMusic
}, {
  id: "playlist3",
  label: "Focus Mode",
  icon: ListMusic
}];
export function Sidebar({
  activeTab,
  onTabChange
}: SidebarProps) {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user,
    profile,
    loading,
    signOut
  } = useAuth();
  const handleSignOut = async () => {
    const {
      error
    } = await signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully."
      });
    }
  };
  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };
  return <aside className="w-60 h-full bg-background/80 backdrop-blur-xl flex flex-col border-r border-border/30">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Music2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Pear Music</span>
      </div>

      {/* Main Navigation */}
      <nav className="px-3 space-y-1">
        {mainNavItems.map(item => <button key={item.id} onClick={() => onTabChange(item.id)} className={cn("nav-item w-full", activeTab === item.id && "active bg-accent")}>
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>)}
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
          {playlists.map(playlist => <button key={playlist.id} onClick={() => onTabChange(playlist.id)} className={cn("nav-item w-full", activeTab === playlist.id && "active bg-accent")}>
              <playlist.icon className={cn("w-5 h-5", playlist.id === "liked" && "text-primary")} />
              <span className="text-sm truncate">{playlist.label}</span>
            </button>)}
        </div>
      </div>

      {/* User Section */}
      {loading ? <div className="p-4 m-3 rounded-lg bg-card border border-border/50">
          <div className="animate-pulse h-10 bg-muted rounded" />
        </div> : user ? <div className="p-4 m-3 rounded-lg bg-card border border-border/50 opacity-100">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              
              
            </div>
          </div>
          
        </div> : <div className="p-4 m-3 rounded-lg bg-card border border-border/50">
          <p className="text-sm text-muted-foreground mb-3">
            Sign in to create playlists and get personalized recommendations
          </p>
          <button onClick={() => navigate('/auth')} className="w-full py-2 px-4 rounded-full border border-muted-foreground/50 text-sm font-medium text-foreground hover:border-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2">
            <User className="w-4 h-4" />
            Sign in
          </button>
        </div>}
    </aside>;
}