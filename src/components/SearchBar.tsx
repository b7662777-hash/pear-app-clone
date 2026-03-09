import { Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useCallback } from "react";
import { SearchDropdown } from "./SearchDropdown";
import { usePlayer } from "@/contexts/PlayerContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
  searchResults?: Array<{
    id: string;
    title: string;
    artist: string;
    image: string;
    videoId?: string;
  }>;
}

export function SearchBar({ value, onChange, isSearching = false, searchResults = [] }: SearchBarProps) {
  const { user, profile } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { playTrack } = usePlayer();

  const trendingGenres = ["Lo-fi", "Hip Hop", "Classical", "Phonk", "Jazz", "Electronic"];
  const suggestions = value.length >= 2
    ? [`${value} songs`, `${value} remix`, `${value} playlist`, `${value} album`, `${value} live`, `${value} acoustic`].slice(0, 6)
    : trendingGenres;

  const handleInputFocus = () => setIsDropdownOpen(true);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setIsDropdownOpen(true);
  };

  const handleClear = () => {
    onChange("");
    setIsDropdownOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsDropdownOpen(true);
  };

  const handleResultClick = useCallback((result: { id: string; title: string; artist: string; image: string; videoId?: string; }) => {
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

  const getInitials = () => {
    if (profile?.display_name) return profile.display_name.slice(0, 2).toUpperCase();
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "U";
  };

  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 bg-background/30 backdrop-blur-sm py-3 px-4 md:px-6">
      <div className="relative flex-1 max-w-[520px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          className="w-full rounded-lg border border-border bg-muted/60 hover:bg-muted focus:bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors text-sm pl-10 pr-10 py-2.5"
          placeholder="Search songs, albums, artists, podcasts"
        />

        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        <SearchDropdown
          query={value}
          suggestions={suggestions}
          results={searchResults}
          isOpen={isDropdownOpen}
          isSearching={isSearching}
          onClose={() => setIsDropdownOpen(false)}
          onSuggestionClick={handleSuggestionClick}
          onResultClick={handleResultClick}
        />
      </div>

      <div className="flex-1" />

      <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-ring/50 transition-all flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {getInitials()}
          </AvatarFallback>
      </Avatar>
    </header>
  );
}

