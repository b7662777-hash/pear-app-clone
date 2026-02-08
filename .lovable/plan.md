
# UI Refinement: Match YouTube Music Reference Design

## Overview
This plan refines the existing solid-dark theme implementation to more closely match the YouTube Music desktop app shown in your reference screenshots. The key differences involve adjustments to the "Listen again" section header, enhanced Right Panel features, search dropdown with suggestions, and adding more detailed track information.

---

## 1. ListenAgainSection Header Enhancement

### Current State
- Shows generic "BLUE SUN" label and rounded avatar image
- Grid shows 4 cards + 1 featured track on the right

### Reference (Screenshot 141)
- Shows "BLUE SUN" as an artist/profile name above "Listen again"
- Avatar is a rounded square (not circle)
- "More" button on the right with navigation arrows
- Grid shows 6 album cards in a row (not 4)
- Track cards show EP/Song type indicators with additional metadata (views count)

### Changes
**File: `src/components/ListenAgainSection.tsx`**

- Change avatar from `rounded-full` to `rounded-lg` (square with rounded corners)
- Add "More" button on the right side of the header
- Add navigation arrows (< >) next to "More" button
- Increase grid from 4 columns to 6 columns on larger screens
- Add metadata below track title: "Song/EP • Artist • View count"
- Remove the featured track promotion on the right side for a uniform grid

---

## 2. Right Panel (UP NEXT) Tab Enhancement

### Current State
- Simple track list with thumbnail, title, artist
- No "Playing from" header
- No Auto-play toggle
- No duration display
- No filter chips

### Reference (Screenshot 142)
- "Playing from" header with playlist name and "Save" button
- Auto-play toggle with description
- Current track highlighted with speaker icon
- Track duration shown on the right
- Filter chips: "All", "Familiar", "Discover", "Popular", "Deep cuts", "Workout"

### Changes
**File: `src/components/RightPanel.tsx`**

- Add "Playing from" header section with current playlist name
- Add "Save" button (bookmark icon + "Save" text)
- Add Auto-play toggle with description text
- Highlight currently playing track with speaker/volume icon
- Display track duration on the right side of each track row
- Add filter chips row below the queue list

---

## 3. Right Panel (LYRICS) Tab Enhancement

### Current State
- Large lyrics text, left-aligned
- No provider indicator

### Reference (Screenshot 143)
- Shows provider indicator with checkmark (e.g., "YTMusic" with star)
- Navigation arrows and dot indicators for provider switching
- Large white lyrics, left-aligned

### Changes
**File: `src/components/RightPanel.tsx`**

- Add provider indicator header with checkmark icon and provider name
- Add dot indicators showing current provider
- Keep existing large text styling

---

## 4. Right Panel (RELATED) Tab Enhancement

### Current State
- Simple list of queue tracks

### Reference (Screenshot 144)
- "You might also like" section header with navigation arrows
- Track rows showing dual album art (current track + related track)
- "Recommended playlists" section with playlist cards
- Playlist cards show overlay text (e.g., "PHONK TRENDING")

### Changes
**File: `src/components/RightPanel.tsx`**

- Add "You might also like" section header
- Add navigation arrows to section header
- Show dual album art for track relationships
- Add "Recommended playlists" section below
- Style playlist cards with overlay labels

---

## 5. Search Dropdown with Suggestions

### Current State
- Simple search input
- Results display inline in the main content area

### Reference (Screenshot 146)
- Dropdown appears below search input
- Shows autocomplete text suggestions with search icon
- Shows song results with thumbnails
- Clear (X) button to close

### Changes
**File: `src/components/SearchBar.tsx`** and **New File: `src/components/SearchDropdown.tsx`**

- Create a new `SearchDropdown.tsx` component
- Show dropdown panel below search input when typing
- Display autocomplete suggestions (search queries) at the top
- Display matching songs with thumbnails below
- Add clear (X) button in search input
- Close dropdown on outside click or selection

---

## 6. Add "Upgrade" to Sidebar Navigation

### Reference (Screenshot 141)
- Sidebar shows: Home, Explore, Library, Upgrade

### Changes
**File: `src/components/Sidebar.tsx`** and **`src/components/SidebarShell.tsx`**

- Add "Upgrade" navigation item after Library (icon: sparkle or crown)
- Link to a placeholder upgrade page or show as disabled

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ListenAgainSection.tsx` | Header with "More" button, 6-column grid, metadata |
| `src/components/RightPanel.tsx` | Enhanced UP NEXT, LYRICS, RELATED tabs |
| `src/components/SearchBar.tsx` | Clear button, dropdown integration |
| `src/components/SearchDropdown.tsx` | **NEW** - Autocomplete dropdown |
| `src/components/Sidebar.tsx` | Add "Upgrade" nav item |
| `src/components/SidebarShell.tsx` | Add "Upgrade" nav item |

---

## Technical Details

### SearchDropdown Component Structure
```text
+--------------------------------------------+
| [Search icon] "abhi na ja"           [X]   |
+--------------------------------------------+
| 🔍 abhi na jao chhod kar                   |
| 🔍 abhi na jao chhod kar rocky aur rani    |
| 🔍 abhi na jao chhod kar rekha bhardwaj    |
| 🔍 abhi na jao                             |
+--------------------------------------------+
| [Thumbnail] Abhi Na Jao Chhod Kar          |
|             Song • Asha Bhosle, Mohan...   |
| [Thumbnail] Abhi Na Jao Chhod Kar (Film... |
|             Song • Pritam & Shashwat...    |
+--------------------------------------------+
```

### RightPanel UP NEXT Tab Structure
```text
+--------------------------------------------+
| Playing from                    [Save btn] |
| From The Start                             |
+--------------------------------------------+
| Auto-play                          [Toggle]|
| Add similar content to the end...          |
+--------------------------------------------+
| [🔊] From The Start                   1:19 |
|      -Prey, ZMAJOR, zxnc and Emrld!        |
| [ ] From The Start (Slowed)           1:31 |
| [ ] From The Start (Super Slowed)     1:45 |
+--------------------------------------------+
| Auto-play is on                            |
+--------------------------------------------+
| [All] [Familiar] [Discover] [Popular] ...  |
+--------------------------------------------+
| [ ] Montagem Batchi                   3:19 |
| [ ] LUNA BALA (Slowed)                2:05 |
+--------------------------------------------+
```

---

## Visual Comparison

```text
CURRENT:
┌─────────────────────────────────────────────────┐
│ [○ Avatar] BLUE SUN                             │
│            Listen again                         │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐        ┌─────────┐     │
│ │ 1 │ │ 2 │ │ 3 │ │ 4 │        │Featured │     │
│ └───┘ └───┘ └───┘ └───┘        └─────────┘     │
└─────────────────────────────────────────────────┘

AFTER (Reference Match):
┌─────────────────────────────────────────────────┐
│ [□] BLUE SUN                      [More] [<][>]│
│     Listen again                               │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│ │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │           │
│ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘           │
│  Title   Title   Title   Title   Title  Title │
│  EP•Art  Song•A  Song•A  Song•A  Song•A EP•Ar │
└─────────────────────────────────────────────────┘
```

---

## Notes

- The core solid-dark theme remains unchanged
- Ambient background behavior is preserved
- These refinements focus on matching the YouTube Music reference layout and features
- All existing functionality (playback, lyrics sync, search) remains intact
- Filter chips in UP NEXT tab will filter by mood/type (initially visual-only)
