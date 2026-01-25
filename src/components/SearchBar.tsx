import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { UserProfileMenu } from "./UserProfileMenu";
import { useAuth } from "@/hooks/useAuth";
import { useScrollOpacity } from "@/hooks/useScrollOpacity";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const { user, profile } = useAuth();
  const { hasScrolled, opacity } = useScrollOpacity(80, 0.85, 1);

  return (
    <header 
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-3 transition-all duration-300",
        hasScrolled 
          ? "glass border-b border-white/[0.05]" 
          : "bg-transparent"
      )}
      style={{ opacity }}
    >
      {/* Search Input */}
      <div className="relative flex-1 max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
        <input
          type="text"
          placeholder="Search songs, albums, artists, podcasts"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full glass-light rounded-full px-4 py-2.5 pl-12 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/[0.08] transition-all duration-300"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <button 
          className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95" 
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 text-white/60" />
        </button>
        <button 
          className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95" 
          aria-label="Go forward"
        >
          <ChevronRight className="w-5 h-5 text-white/60" />
        </button>
        
        {/* User Profile */}
        <div className="ml-2">
          <UserProfileMenu user={user} profile={profile} />
        </div>
      </div>
    </header>
  );
}
