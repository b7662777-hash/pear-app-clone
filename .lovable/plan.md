

# Fix Blank Space on Explore Page

## Problem
The Explore page has visible blank/empty space on the right side. While the grid columns are properly configured, the content is sparse in several sections, creating visual gaps.

## Changes

### File: `src/pages/Explore.tsx`

1. **Add more genres** to fill the grid rows evenly (add 4 more genres like "Latin", "Metal", "Indie", "Reggae" to make 12 total -- two full rows of 6)

2. **Add more mood chips** and make the mood section use a grid layout instead of `flex flex-wrap` so items stretch across the full width:
   - Change from `flex flex-wrap gap-3` to `grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3`
   - Make each mood button `w-full` so it stretches within its column

3. **Add more chart items** to fill the grid (add "Top Podcasts" as a 4th item to fill the `lg:grid-cols-4` grid evenly)

4. **Add full-width section backgrounds** to each section using rounded `bg-[#1a1a1a]/30` containers with padding, so sections visually span the entire content width even where grid cells are empty

---

## Technical Details

| Area | Current | After |
|------|---------|-------|
| Genres | 8 items (6+2 rows) | 12 items (6+6 rows, fully filled) |
| Moods | `flex flex-wrap` (left-aligned chips) | `grid grid-cols-6` (full-width stretch) |
| Charts | 3 items in 4-col grid | 4 items (fully filled) |
| Section styling | No backgrounds | Subtle section backgrounds spanning full width |

