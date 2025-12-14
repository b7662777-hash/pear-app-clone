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
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {moods.map((mood) => (
        <button
          key={mood}
          onClick={() => onSelect(selected === mood ? null : mood)}
          className={cn(
            "mood-chip whitespace-nowrap",
            selected === mood && "bg-foreground text-background"
          )}
        >
          {mood}
        </button>
      ))}
    </div>
  );
}
