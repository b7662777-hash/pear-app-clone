import { Play } from "lucide-react";
import { useEffect } from "react";
import { optimizeImageUrl } from "@/lib/imageUtils";

interface Track {
  id: string;
  title: string;
  artist: string;
  image: string;
  videoId?: string;
}

interface ListenAgainSectionProps {
  tracks: Track[];
  featuredTrack?: Track | null;
  onTrackClick: (track: Track) => void;
}

export function ListenAgainSection({ tracks, featuredTrack, onTrackClick }: ListenAgainSectionProps) {
  // Preload LCP images for better discovery
  // - Featured track for desktop (lg screens)
  // - First track in grid for mobile
  useEffect(() => {
    const preloadLinks: HTMLLinkElement[] = [];
    
    // Preload featured track image for desktop LCP
    if (featuredTrack?.image) {
      const imageUrl = optimizeImageUrl(featuredTrack.image, 200);
      const existingPreload = document.querySelector(`link[rel="preload"][href="${imageUrl}"]`);
      
      if (!existingPreload) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = imageUrl;
        preloadLink.setAttribute('fetchpriority', 'high');
        preloadLink.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(preloadLink);
        preloadLinks.push(preloadLink);
      }
    }
    
    // Preload first track image for mobile LCP
    if (tracks[0]?.image) {
      const imageUrl = optimizeImageUrl(tracks[0].image, 160);
      const existingPreload = document.querySelector(`link[rel="preload"][href="${imageUrl}"]`);
      
      if (!existingPreload) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = imageUrl;
        preloadLink.setAttribute('fetchpriority', 'high');
        preloadLink.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(preloadLink);
        preloadLinks.push(preloadLink);
      }
    }
    
    return () => {
      preloadLinks.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [featuredTrack?.image, tracks]);

  if (tracks.length === 0) return null;

  const displayTracks = tracks.slice(0, 4);

  return (
    <section className="mb-10">
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-5">
        {featuredTrack && (
          <img 
            src={optimizeImageUrl(featuredTrack.image, 48)} 
            alt="" 
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/[0.1]"
          />
        )}
        <div>
          <span className="text-xs text-white/40 uppercase tracking-wider font-medium">BLUE SUN</span>
          <h2 className="text-2xl font-bold text-foreground">Listen again</h2>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Track grid with stagger animation */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayTracks.map((track, index) => (
            <div
              key={track.id}
              onClick={() => onTrackClick(track)}
              className="group relative cursor-pointer bg-[#1a1a1a] hover:bg-[#252525] rounded-xl p-3 transition-colors"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                <img
                  src={optimizeImageUrl(track.image, 160)}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : undefined}
                  crossOrigin={index === 0 ? "anonymous" : undefined}
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg"
                    aria-label={`Play ${track.title}`}
                  >
                    <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground truncate">{track.title}</h3>
              <p className="text-xs text-white/50 truncate">{track.artist}</p>
            </div>
          ))}
        </div>

        {/* Featured album on right */}
        {featuredTrack && (
          <div 
            onClick={() => onTrackClick(featuredTrack)}
            className="hidden lg:block w-[200px] flex-shrink-0 group cursor-pointer"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg">
              <img
                src={optimizeImageUrl(featuredTrack.image, 200)}
                alt={featuredTrack.title}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg" 
                  aria-label={`Play ${featuredTrack.title}`}
                >
                  <Play className="w-7 h-7 text-black fill-black ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
