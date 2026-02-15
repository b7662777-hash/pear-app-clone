import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlayerProvider, usePlayer } from "@/contexts/PlayerContext";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Explore = lazy(() => import("./pages/Explore"));
const Library = lazy(() => import("./pages/Library"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GlobalPlayer = lazy(() => import("@/components/GlobalPlayer").then((m) => ({ default: m.GlobalPlayer })));

// Lazy load toast components - not needed for initial render
const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));

const queryClient = new QueryClient();

// Simple loading fallback
const PageLoader = () =>
<div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground px-[100px]">Loading...</div>
  </div>;


// Conditionally render GlobalPlayer only when a track is loaded
// This defers loading the 25KB GlobalPlayer bundle until needed
const ConditionalGlobalPlayer = () => {
  const { currentTrack } = usePlayer();
  if (!currentTrack) return null;
  return (
    <Suspense fallback={null}>
      <GlobalPlayer />
    </Suspense>);

};

const App = () =>
<QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Suspense fallback={null}>
        <Toaster />
        <Sonner />
      </Suspense>
      <BrowserRouter>
        <PlayerProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/library" element={<Library />} />
              <Route path="/library/liked" element={<Library />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ConditionalGlobalPlayer />
          </Suspense>
        </PlayerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;


export default App;