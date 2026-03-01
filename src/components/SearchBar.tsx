import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { SearchDropdown } from "./SearchDropdown";
import { usePlayer } from "@/contexts/PlayerContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { playTrack } = usePlayer();

  const trendingGenres = ["Lo-fi", "Hip Hop", "Classical", "Phonk", "Jazz", "Electronic"];
  const suggestions = value.length >= 2 ?
  [
    `${value} songs`,
    `${value} remix`,
    `${value} playlist`,
    `${value} album`,
    `${value} live`,
    `${value} acoustic`,
  ].slice(0, 6) :
  trendingGenres;

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
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

  const handleResultClick = useCallback((result: {id: string;title: string;artist: string;image: string;videoId?: string;}) => {
    if (result.videoId) {
      playTrack({
        id: result.id,
        title: result.title,
        artist: result.artist,
        image: result.image,
        videoId: result.videoId,
        album: "",
        plays: "",
        duration: 0
      }, []);
    }
    setIsDropdownOpen(false);
  }, [playTrack]);

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 bg-transparent py-2 px-4 md:px-6">
      {/* Search Input */}
      <div className="relative flex-1 max-w-[480px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] focus:bg-[#3a3a3a] rounded-lg text-white placeholder:text-white/50 focus:outline-none transition-colors text-sm pl-10 pr-10 py-2.5"
          placeholder="Search songs, albums, artists, podcasts"
        />

        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/[0.1] transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        )}

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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          className="p-2 rounded-full hover:bg-white/[0.08] transition-colors hidden md:block"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 text-white/70" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-white/[0.08] transition-colors hidden md:block"
          aria-label="Go forward"
        >
          <ChevronRight className="w-6 h-6 text-white/70" />
        </button>
        
        {/* User Avatar */}
        <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-white/20 transition-all ml-2">
          <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || undefined} />
          <AvatarFallback className="bg-purple-600 text-white text-xs font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
