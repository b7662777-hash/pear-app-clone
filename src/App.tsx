import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PlayerProvider, usePlayer } from "@/contexts/PlayerContext";
import { useAuthReady } from "@/hooks/useAuthReady";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Explore = lazy(() => import("./pages/Explore"));
const Library = lazy(() => import("./pages/Library"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GlobalPlayer = lazy(() => import("@/components/GlobalPlayer").then((m) => ({ default: m.GlobalPlayer })));

const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const ConditionalGlobalPlayer = () => {
  const { currentTrack } = usePlayer();
  if (!currentTrack) return null;
  return (
    <Suspense fallback={null}>
      <GlobalPlayer />
    </Suspense>
  );
};

const GUEST_MODE_KEY = "pear-music-guest-mode";

const AppRoutes = () => {
  const { user, isReady } = useAuthReady();
  const isGuest = localStorage.getItem(GUEST_MODE_KEY) === "true";
  const hasAccess = !!user || isGuest;

  if (!isReady) {
    return <PageLoader />;
  }

  return (
    <>
      <Routes>
        <Route path="/auth" element={hasAccess ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={hasAccess ? <Index /> : <Navigate to="/auth" replace />} />
        <Route path="/explore" element={hasAccess ? <Explore /> : <Navigate to="/auth" replace />} />
        <Route path="/library" element={hasAccess ? <Library /> : <Navigate to="/auth" replace />} />
        <Route path="/library/liked" element={hasAccess ? <Library /> : <Navigate to="/auth" replace />} />
        <Route path="/profile" element={hasAccess ? <Profile /> : <Navigate to="/auth" replace />} />
        <Route path="/settings" element={hasAccess ? <Settings /> : <Navigate to="/auth" replace />} />
        <Route path="*" element={hasAccess ? <NotFound /> : <Navigate to="/auth" replace />} />
      </Routes>
      {hasAccess ? <ConditionalGlobalPlayer /> : null}
    </>
  );
};

const AppContent = () => {
  return (
    <PlayerProvider>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
    </PlayerProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Suspense fallback={null}>
        <Toaster />
        <Sonner />
      </Suspense>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
