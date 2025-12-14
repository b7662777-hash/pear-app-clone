import { Search, Cast, History, MoreVertical } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-4 bg-background/80 backdrop-blur-lg">
      {/* Search Input */}
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search songs, albums, artists, podcasts"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button className="player-control">
          <Cast className="w-5 h-5" />
        </button>
        <button className="player-control">
          <History className="w-5 h-5" />
        </button>
        <button className="player-control">
          <MoreVertical className="w-5 h-5" />
        </button>
        
        {/* Sign In Button */}
        <button className="ml-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          Sign in
        </button>
      </div>
    </header>
  );
}
