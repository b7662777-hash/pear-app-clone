import { cn } from "@/lib/utils";

const moods = [
  "Podcasts",
  "Relax",
  "Energize",
  "Workout",
  "Feel good",
  "Romance",
  "Party",
  "Sleep",
  "Sad",
  "Commute",
  "Focus",
];

interface MoodChipsProps {
  selected: string | null;
  onSelect: (mood: string | null) => void;
}

export function MoodChips({ selected, onSelect }: MoodChipsProps) {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
      {moods.map((mood) => (
        <button
          key={mood}
          onClick={() => onSelect(selected === mood ? null : mood)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
            selected === mood 
              ? "bg-[#7a663f] text-white shadow-[0_10px_20px_-15px_rgba(0,0,0,0.6)]" 
              : "bg-[#5d4b2f] text-white/80 hover:bg-[#6b5837] hover:text-white"
          )}
        >
          {mood}
        </button>
      ))}
    </div>
  );
}
