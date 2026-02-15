import { Search, ChevronLeft, ChevronRight, X, Users } from "lucide-react";
import { UserProfileMenu } from "./UserProfileMenu";
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

  // Generate suggestions based on current query only (no history)
  const trendingGenres = ["Lo-fi", "Hip Hop", "Classical", "Phonk", "Jazz", "Electronic"];
  const suggestions = value.length >= 2 ?
  [
  `${value} songs`,
  `${value} remix`,
  `${value} playlist`,
  `${value} album`,
  `${value} live`,
  `${value} acoustic`].
  slice(0, 6) :
  trendingGenres;

  const handleInputFocus = () => {
    // Show dropdown on focus (trending genres when empty, suggestions when typing)
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
    <header className="sticky top-0 z-40 flex items-center justify-between gap-2 md:gap-4 bg-transparent md:px-0 pr-0 pl-[250px] my-[10px] py-px px-[25px]">
      {/* Search Input */}
      <div className="relative flex-1 max-w-full md:max-w-[480px] py-0 pt-0 px-px mx-px my-px pr-[250px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 text-white/50 w-[20px] px-0 pr-0 pb-0 my-0 mx-px" />
        <input
          type="text"

          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          className="w-full bg-[#3d3d3d] hover:bg-[#4a4a4a] focus:bg-[#4a4a4a] rounded-lg py-2.5 text-white placeholder:text-white/50 focus:outline-none transition-colors text-sm mx-px ml-0 mr-0 pl-[40px] pr-[40px] px-[150px]" placeholder="Search Songs, Music, Artists , Playlists" />

        {value &&
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/[0.1] transition-colors"
          aria-label="Clear search">

            <X className="w-5 h-5 text-white/60" />
          </button>
        }

        {/* Search Dropdown */}
        <SearchDropdown
          query={value}
          suggestions={suggestions}
          results={searchResults}
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          onSuggestionClick={handleSuggestionClick}
          onResultClick={handleResultClick} />

      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 pt-0 pr-[10px] pl-[500px] mx-px px-[5px]">
        <button
          className="p-2 rounded-full hover:bg-white/[0.08] transition-colors hidden md:block"
          aria-label="Go back">

          <ChevronLeft className="w-6 h-6 text-white/70" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-white/[0.08] transition-colors hidden md:block"
          aria-label="Go forward">

          <ChevronRight className="w-6 h-6 text-white/70" />
        </button>
        
        <button
          className="p-2 rounded-full hover:bg-white/[0.08] transition-colors hidden sm:block"
          aria-label="Cast">

          <Users className="w-5 h-5 text-white/70" />
        </button>
        
        {/* User Avatar */}
        <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-white/20 transition-all">
          <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || undefined} />
          <AvatarFallback className="bg-purple-600 text-white text-xs font-medium">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>);

}