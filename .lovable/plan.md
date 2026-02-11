

# Fix Plan: Blank Pages, Search Context Leak, and Home Recommendations

## Issue 1: Fix Blank/Black Pages in Tabs

**Root Cause**: The Explore and Library pages render content but have no loading states or fallbacks. If data is slow to load or undefined, users see a blank dark screen. Additionally, the `bg-transparent` containers combined with the ambient background (which only activates when a track is playing) result in a pure black screen when no track is active.

**Changes**:

- **`src/pages/Explore.tsx`**: Add a subtle dark background fallback (`bg-[#0f0f0f]`) instead of fully transparent, so the page is never invisible. The ambient background will still show through since it uses fixed positioning with z-0.
- **`src/pages/Library.tsx`**: Same background fallback. Add a loading spinner state while `isLoading` is true instead of showing nothing.
- **`src/pages/Index.tsx`**: Same background fallback. Add a loading skeleton/spinner when `isLoadingRecommended` is true and there are no cached tracks.
- **All pages**: Wrap main content in a conditional that shows a "No music found" empty state if data loads but returns empty.

## Issue 2: Reset Search Suggestions (Stop Context Leaking)

**Root Cause**: In `src/components/SearchBar.tsx` (lines 28-37), the suggestions are hardcoded with Hindi song fragments like `"chhod kar"`, `"rocky aur rani"`, `"rekha bhardwaj"`, etc. These are static strings appended to whatever the user types, creating the illusion of "remembering" previous searches.

**Changes**:

- **`src/components/SearchBar.tsx`**: Replace the hardcoded suggestion strings with generic, query-based completions. When the input is empty, show trending genre chips (Lo-fi, Hip Hop, Classical, Phonk, etc.). When typing, generate neutral suggestions like `"{query} songs"`, `"{query} remix"`, `"{query} playlist"`, `"{query} album"`.
- **`src/components/SearchDropdown.tsx`**: No structural changes needed -- it correctly renders whatever suggestions are passed to it.

## Issue 3: Home Screen Recommendations (YTM-style Layout)

**Root Cause**: The home screen currently makes a single random search query ("trending songs 2025" or "popular music" or "top hits") and splits the 12 results between "Listen Again" (first 6) and "Similar To" (last 6). This doesn't provide distinct content categories.

**Changes**:

- **`src/hooks/useYouTubeMusic.ts`**: Add two new fetch functions:
  - `fetchTrendingTracks()` - searches for "trending music 2025" specifically
  - `fetchNewReleases()` - searches for "new music releases 2025"
  - Keep `fetchRecommendedTracks()` for the "Quick Picks" row
  - Each returns separate state arrays with independent loading states

- **`src/pages/Index.tsx`**: Reorganize the home screen into distinct horizontal scrolling rows:
  1. **"Quick Picks"** - Uses the existing `QuickPicks` component with the first batch of recommended tracks (3-column list layout)
  2. **"Listen again"** - Uses `ListenAgainSection` with recommended tracks (horizontal card grid)
  3. **"Trending"** - New horizontal row using trending tracks data
  4. **"New Releases"** - New horizontal row using new releases data
  5. **"Similar to [Last Played Artist]"** - Uses `SimilarToSection`, dynamically updates title based on `currentTrack?.artist`

- **`src/components/RecommendedSongs.tsx`**: Create a new reusable horizontal scroll row component for "Trending" and "New Releases" sections with the same card style as ListenAgainSection.

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add bg fallback, loading skeleton, reorganize into Quick Picks / Listen Again / Trending / New Releases / Similar To rows |
| `src/pages/Explore.tsx` | Add `bg-[#0f0f0f]` fallback background |
| `src/pages/Library.tsx` | Add `bg-[#0f0f0f]` fallback, loading spinner while data loads |
| `src/components/SearchBar.tsx` | Replace hardcoded Hindi suggestions with generic query completions and trending genres when empty |
| `src/hooks/useYouTubeMusic.ts` | Add `fetchTrendingTracks()` and `fetchNewReleases()` with separate state |
| `src/components/RecommendedSongs.tsx` | New reusable horizontal scroll row component for content sections |

