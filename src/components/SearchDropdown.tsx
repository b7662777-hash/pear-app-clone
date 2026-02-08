import { useEffect, useRef } from "react";
import { Search, Play } from "lucide-react";
import { optimizeImageUrl } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";

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
  onClose: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onResultClick: (result: SearchResult) => void;
}

export function SearchDropdown({
  query,
  suggestions,
  results,
  isOpen,
  onClose,
  onSuggestionClick,
  onResultClick,
}: SearchDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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

  // Close on escape
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

  if (!isOpen || (!suggestions.length && !results.length && !query)) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden z-50"
    >
      {/* Autocomplete suggestions */}
      {suggestions.length > 0 && (
        <div className="py-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={`suggestion-${index}`}
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.08] transition-colors text-left"
            >
              <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
              <span className="text-sm text-white truncate">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      {suggestions.length > 0 && results.length > 0 && (
        <div className="h-px bg-white/[0.08]" />
      )}

      {/* Song results */}
      {results.length > 0 && (
        <div className="py-2">
          {results.slice(0, 5).map((result) => (
            <button
              key={result.id}
              onClick={() => onResultClick(result)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/[0.08] transition-colors text-left group"
            >
              <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                <img
                  src={optimizeImageUrl(result.image, 80)}
                  alt={result.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{result.title}</p>
                <p className="text-xs text-white/50 truncate">Song • {result.artist}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results state */}
      {query && suggestions.length === 0 && results.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-white/50">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
