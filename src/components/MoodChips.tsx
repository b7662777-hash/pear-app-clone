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
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap border",
            selected === mood 
              ? "bg-foreground text-background border-transparent" 
              : "bg-transparent text-foreground border-border/60 hover:bg-accent hover:border-border"
          )}
        >
          {mood}
        </button>
      ))}
    </div>
  );
}
