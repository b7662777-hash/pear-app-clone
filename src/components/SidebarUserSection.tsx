import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SidebarUserSection() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="p-4 m-3 rounded-xl glass-card-premium">
        <div className="animate-shimmer h-10 rounded" />
      </div>
    );
  }

  if (user) {
    return (
      <div 
        className="p-4 m-3 rounded-xl glass-card-premium cursor-pointer group" 
        onClick={() => navigate('/profile')}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-white/[0.1] group-hover:ring-white/[0.2] transition-all">
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
    );
  }

  return (
    <div className="p-4 m-3 rounded-xl glass-card-premium">
      <p className="text-sm text-muted-foreground mb-3">
        Sign in to create playlists and save songs
      </p>
      <button 
        onClick={() => navigate('/auth')} 
        className="w-full py-2.5 px-4 rounded-xl bg-white/[0.1] hover:bg-white/[0.15] text-sm font-medium text-foreground transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
      >
        <User className="w-4 h-4" />
        Sign in
      </button>
    </div>
  );
}

export default SidebarUserSection;
