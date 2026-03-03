import { useEffect, useRef } from "react";
import { Search, Play, Loader2 } from "lucide-react";
import { optimizeImageUrl } from "@/lib/imageUtils";

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  image: string;
  videoId?: string;
}

interface SearchDropdownProps {
  query: string;
  suggestions: string[];
  results: SearchResult[];
  isOpen: boolean;
  isSearching?: boolean;
  onClose: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onResultClick: (result: SearchResult) => void;
}

export function SearchDropdown({
  query,
  suggestions,
  results,
  isOpen,
  isSearching = false,
  onClose,
  onSuggestionClick,
  onResultClick,
}: SearchDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || (!suggestions.length && !results.length && !query && !isSearching)) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur-md overflow-hidden z-50 max-h-[420px] overflow-y-auto"
    >
      {suggestions.length > 0 && (
        <div className="py-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={`suggestion-${index}`}
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/70 transition-colors text-left"
            >
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (results.length > 0 || isSearching) && (
        <div className="h-px bg-border" />
      )}

      {isSearching && (
        <div className="py-6 px-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Searching songs...</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="py-2">
          {results.slice(0, 6).map((result) => (
            <button
              key={result.id}
              onClick={() => onResultClick(result)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted/70 transition-colors text-left group"
            >
              <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                <img
                  src={optimizeImageUrl(result.image, 80)}
                  alt={result.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-4 h-4 text-foreground fill-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                <p className="text-xs text-muted-foreground truncate">Song • {result.artist}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {query && !isSearching && suggestions.length === 0 && results.length === 0 && (
        <div className="py-8 text-center px-4">
          <p className="text-sm text-muted-foreground">No results found for “{query}”</p>
        </div>
      )}
    </div>
  );
}

