import { TrackCard } from "./TrackCard";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  plays: string;
  image: string;
}

interface QuickPicksProps {
  tracks: Track[];
  currentTrackId: string | null;
  onTrackClick: (track: Track) => void;
}

export function QuickPicks({ tracks, currentTrackId, onTrackClick }: QuickPicksProps) {
  // Split tracks into 3 columns
  const columns = [
    tracks.slice(0, 4),
    tracks.slice(4, 8),
    tracks.slice(8, 12),
  ];

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Quick picks</h2>
        <button className="px-4 py-1.5 rounded-full border border-muted-foreground/50 text-sm font-medium text-foreground hover:border-foreground transition-colors">
          Play all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="space-y-1">
            {column.map((track) => (
              <TrackCard
                key={track.id}
                title={track.title}
                artist={`${track.artist} • ${track.plays}`}
                image={track.image}
                isPlaying={currentTrackId === track.id}
                onClick={() => onTrackClick(track)}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
