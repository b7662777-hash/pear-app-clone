

# Fix: Fill Full Screen Width on All Pages

## Problem
The content area on Library, Explore, and Search Results pages only occupies roughly the left half of the screen. The right side shows blank/black space because:

1. **Library page**: The Quick Access cards use `grid-cols-1 md:grid-cols-2` which only fills part of the width. The Artists and Albums empty states are centered text that doesn't span the full area. The content visually "stops" because there are no background fills on sections.
2. **Explore page**: Content sections end prematurely with no visual fill for the remaining space.
3. **Search Results page**: The results grid uses `grid-cols-1 md:grid-cols-2` leaving the right side empty.

## Solution

Make all content sections stretch to fill the full available width by:

1. **Library page (`src/pages/Library.tsx`)**:
   - Change Quick Access grid from `grid-cols-1 md:grid-cols-2` to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` so cards stretch wider on large screens
   - Change Playlists grid from `grid-cols-2 md:grid-cols-4 lg:grid-cols-5` to include `xl:grid-cols-6` for wider coverage
   - Add `min-h-[200px]` to Artists and Albums empty state containers and use full-width background styling so they don't leave blank gaps
   - All three return blocks (playlist detail, liked songs, main library) need the same treatment

2. **Explore page (`src/pages/Explore.tsx`)**:
   - Expand the genre grid to include `lg:grid-cols-5 xl:grid-cols-6` for wider screens
   - Expand the trending grid similarly
   - Expand Charts grid from `md:grid-cols-3` to `md:grid-cols-3 lg:grid-cols-4`

3. **Search Results (`src/components/SearchResults.tsx`)**:
   - Change result grid from `grid-cols-1 md:grid-cols-2` to `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` so results fill the full width on wider screens

4. **Index page (`src/pages/Index.tsx`)**:
   - Ensure the search results section also uses expanded grid columns when searching

---

## Technical Details

| File | Change |
|------|--------|
| `src/pages/Library.tsx` | Expand grid column counts for Quick Access, Playlists; add full-width backgrounds to Artists/Albums empty states |
| `src/pages/Explore.tsx` | Add `lg:grid-cols-5 xl:grid-cols-6` to genre/trending grids, expand charts grid |
| `src/components/SearchResults.tsx` | Expand grid to `lg:grid-cols-3 xl:grid-cols-4` |
| `src/pages/Library.tsx` (playlist/liked views) | Ensure song list items stretch full width with proper padding |

