import { Search, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { UserProfileMenu } from "./UserProfileMenu";
import { useAuth } from "@/hooks/useAuth";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-3 bg-black/40 backdrop-blur-xl">
      {/* Search Input */}
      <div className="relative flex-1 max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
        <input
          type="text"
          placeholder="Search songs, albums, artists, podcasts"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2.5 pl-12 text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/15 transition-all duration-200"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <button className="p-2.5 rounded-full hover:bg-accent transition-colors" aria-label="Previous">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2.5 rounded-full hover:bg-accent transition-colors" aria-label="Next">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2.5 rounded-full hover:bg-accent transition-colors ml-2" aria-label="Collaborators">
          <Users className="w-5 h-5 text-muted-foreground" />
        </button>
        
        {/* User Profile / Sign In */}
        <div className="ml-2">
          <UserProfileMenu user={user} profile={profile} />
        </div>
      </div>
    </header>
  );
}
