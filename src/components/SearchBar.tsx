import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { UserProfileMenu } from "./UserProfileMenu";
import { useAuth } from "@/hooks/useAuth";
import { useScrollOpacity } from "@/hooks/useScrollOpacity";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { SearchDropdown } from "./SearchDropdown";
import { usePlayer } from "@/contexts/PlayerContext";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  searchResults?: Array<{
    id: string;
    title: string;
    artist: string;
    image: string;
    videoId?: string;
  }>;
}

export function SearchBar({ value, onChange, searchResults = [] }: SearchBarProps) {
  const { user, profile } = useAuth();
  const { hasScrolled, opacity } = useScrollOpacity(80, 0.85, 1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { playTrack } = usePlayer();

  // Generate suggestions based on query
  const suggestions = value.length >= 2 
    ? [
        value,
        `${value} remix`,
        `${value} slowed`,
        `${value} lyrics`,
      ].slice(0, 4)
    : [];

  const handleInputFocus = () => {
    if (value.length >= 2 || searchResults.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    if (newValue.length >= 2) {
      setIsDropdownOpen(true);
    }
  };

  const handleClear = () => {
    onChange("");
    setIsDropdownOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsDropdownOpen(false);
  };

  const handleResultClick = useCallback((result: { id: string; title: string; artist: string; image: string; videoId?: string }) => {
    if (result.videoId) {
      playTrack({
        id: result.id,
        title: result.title,
        artist: result.artist,
        image: result.image,
        videoId: result.videoId,
        album: "",
        plays: "",
        duration: 0,
      }, []);
    }
    setIsDropdownOpen(false);
  }, [playTrack]);

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
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          className="w-full bg-[#1a1a1a] rounded-full px-4 py-2.5 pl-12 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-[#222] transition-colors"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/[0.1] transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        )}

        {/* Search Dropdown */}
        <SearchDropdown
          query={value}
          suggestions={suggestions}
          results={searchResults}
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          onSuggestionClick={handleSuggestionClick}
          onResultClick={handleResultClick}
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
        
        {/* User Profile */}
        <div className="ml-2">
          <UserProfileMenu user={user} profile={profile} />
        </div>
      </div>
    </header>
  );
}
