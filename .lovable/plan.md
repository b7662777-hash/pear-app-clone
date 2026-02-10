

# Fix Plan: Sidebar Visibility, Ambient Background, and Navigation

## Issues Identified

1. **Sidebar disappears after ~1 second**: The `AmbientBackground` component is `fixed inset-0 z-0` and renders on top of the sidebar. The sidebar has no `z-index`, while the main content area has `relative z-10`. When `AmbientBackground` lazy-loads and mounts, it paints over the sidebar.

2. **Ambient background not showing solid color from album art**: The `AmbientBackground` component and `colorExtractor.ts` are already set up correctly, but the outer page container uses `bg-[#1f1f1f]` which paints over the ambient background. The ambient div is `z-0` and `pointer-events-none` but the page container's opaque background hides it.

3. **Only "Upgrade" showing, no hamburger toggle**: The sidebar nav items all render in the same loop but the hamburger button and YTM logo section at the top may be clipped or hidden. The nav items use `gap-5` which pushes labels far from icons, and the sidebar width of `200px` may cause layout issues with the current flex arrangement.

---

## Fix 1: Sidebar Z-Index and Visibility

**Files: `src/components/Sidebar.tsx`, `src/components/SidebarShell.tsx`**

- Add `relative z-20` to the sidebar `aside` element so it always stays above the ambient background
- This ensures the sidebar never gets covered by the fixed AmbientBackground layer

**Files: `src/pages/Index.tsx`, `src/pages/Explore.tsx`, `src/pages/Library.tsx`**

- Change the outer container from `bg-[#1f1f1f]` to `bg-transparent` so the ambient background shows through
- Ensure the main content area also uses `relative z-10` (already does)

## Fix 2: Solid Ambient Background from Album Art

**File: `src/components/AmbientBackground.tsx`**

- The component is already correctly extracting colors and computing `solidBackground` via `getSolidBackgroundColor()`
- The issue is the page containers have opaque `bg-[#1f1f1f]` backgrounds that block the ambient color
- Fix: Make page containers transparent so the fixed ambient background is visible behind all content

**File: `src/lib/colorExtractor.ts`**

- The `getSolidBackgroundColor` function already works correctly, producing a darkened muted tint
- No changes needed here

## Fix 3: Sidebar Layout - Show All Nav Items and Hamburger Toggle

**Files: `src/components/Sidebar.tsx`, `src/components/SidebarShell.tsx`**

- Reduce nav item `gap` from `gap-5` to `gap-3` for better alignment
- Ensure the hamburger button and YTM logo section renders correctly with proper sizing
- Add `flex-shrink-0` to the header section to prevent it from collapsing
- Make the sidebar width slightly wider: `w-[240px]` expanded (matching YTM reference) vs `w-[72px]` collapsed

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/SidebarShell.tsx` | Add `relative z-20`, fix nav gap, widen to 240px, flex-shrink-0 on header |
| `src/components/Sidebar.tsx` | Same fixes as SidebarShell |
| `src/pages/Index.tsx` | Change `bg-[#1f1f1f]` to `bg-transparent` |
| `src/pages/Explore.tsx` | Change `bg-[#1f1f1f]` to `bg-transparent` |
| `src/pages/Library.tsx` | Change `bg-background` / `bg-[#1f1f1f]` to `bg-transparent` |

