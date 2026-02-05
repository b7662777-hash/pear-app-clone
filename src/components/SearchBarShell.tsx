import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollOpacity } from "@/hooks/useScrollOpacity";
import { cn } from "@/lib/utils";
import { lazy, Suspense } from "react";

// Lazy load the UserProfileMenu which imports heavy Radix components and Supabase
const UserProfileMenuWrapper = lazy(() => import("./UserProfileMenuWrapper"));

interface SearchBarShellProps {
  value: string;
  onChange: (value: string) => void;
}

// Lightweight placeholder for user profile area during lazy load
function ProfilePlaceholder() {
  return (
    <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
  );
}

export function SearchBarShell({ value, onChange }: SearchBarShellProps) {
  const { hasScrolled, opacity } = useScrollOpacity(80, 0.85, 1);

  return (
    <header 
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-3 transition-all duration-300",
        hasScrolled 
          ? "bg-[#0f0f0f]/95 border-b border-white/[0.08]" 
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
          className="w-full bg-[#1a1a1a] rounded-full px-4 py-2.5 pl-12 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-[#222] transition-colors"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <button 
          className="p-2.5 rounded-full hover:bg-white/[0.08] transition-colors" 
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 text-white/60" />
        </button>
        <button 
          className="p-2.5 rounded-full hover:bg-white/[0.08] transition-colors" 
          aria-label="Go forward"
        >
          <ChevronRight className="w-5 h-5 text-white/60" />
        </button>
        
        {/* User Profile - lazy loaded to defer Supabase/Radix */}
        <div className="ml-2">
          <Suspense fallback={<ProfilePlaceholder />}>
            <UserProfileMenuWrapper />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default SearchBarShell;
