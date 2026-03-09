

## Plan: UI Polish, Layout Fixes, and Improvements

### Current State
- The API is **working correctly** — all 3 requests (recommended, trending, new releases) return 200 with song data. Songs ARE loading.
- Color extraction via ColorThief is already implemented in `AmbientBackground.tsx`.
- Synced lyrics via LRCLIB/Musixmatch/YouTube are already implemented.
- The layout has some padding/gaps and the profile icon isn't pinned far-right.

### Changes

#### 1. Edge-to-Edge Layout (No Gaps)
**Files:** `src/pages/Index.tsx`, `src/pages/Explore.tsx`, `src/pages/Library.tsx`
- Remove `px-4 md:px-6` padding from `<main>` and replace with `px-0` on outer, `px-4 md:px-6` only on inner content sections.
- Ensure the root container uses `w-screen h-[100dvh]` with no margin/padding.
- Remove `pb-20` from main and use `pb-24` (just enough for player bar clearance).

#### 2. Profile Icon Pinned Far-Right
**File:** `src/components/SearchBar.tsx`
- Restructure the header to: `[search input] [spacer flex-1] [avatar]`
- Remove the nav arrows (ChevronLeft/ChevronRight) from the search bar — they're non-functional.
- Pin the Avatar to the absolute right with `ml-auto`.

#### 3. Solid Ambient Mode (Already Implemented — Polish)
**File:** `src/components/AmbientBackground.tsx`
- Already uses ColorThief. Will reduce transition duration from 2000ms to 400ms for snappier feel per user request.
- Ensure the solid background color is more prominent (increase lightness slightly in `getSolidBackgroundColor`).

**File:** `src/lib/colorExtractor.ts`
- Adjust `getSolidBackgroundColor` to produce slightly more vibrant/visible colors (current 8-12% lightness can be bumped to 10-15%).

#### 4. Smooth UI & Performance
**File:** `src/index.css`
- Add a global `* { transition-timing-function: ease-in-out; }` for smoother interactions.
- Ensure scrollbar-hide utility class exists for horizontal scroll sections.

**File:** `src/components/ListenAgainSection.tsx`, `src/components/RecommendedSongs.tsx`
- Add `scroll-smooth` to scroll containers.
- Add hover scale transitions to track cards.

#### 5. 100% Synced Lyrics (Already Implemented — Verify & Polish)
**File:** `src/components/SyncedLyrics.tsx`
- Already fully implemented with auto-scroll and seek-on-click.
- Polish: add a subtle glow/scale effect on the active line for better visibility.
- Ensure the active line centering uses `containerHeight / 2` instead of `/3` for true center alignment.

**File:** `src/hooks/useYouTubeMusic.ts`
- Already fetches from LRCLIB with fallback to Musixmatch and YouTube. No changes needed.

### Summary of File Changes
| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Remove outer padding, edge-to-edge layout |
| `src/pages/Explore.tsx` | Same edge-to-edge treatment |
| `src/pages/Library.tsx` | Same edge-to-edge treatment |
| `src/components/SearchBar.tsx` | Pin avatar far-right, remove unused nav arrows |
| `src/components/AmbientBackground.tsx` | Faster 400ms transition |
| `src/lib/colorExtractor.ts` | Slightly more vibrant solid background colors |
| `src/components/SyncedLyrics.tsx` | Better active line styling and centering |
| `src/components/ListenAgainSection.tsx` | Hover animations on cards |
| `src/components/RecommendedSongs.tsx` | Hover animations on cards |
| `src/index.css` | Global smooth transitions |

