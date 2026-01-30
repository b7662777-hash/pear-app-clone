import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preloadLCPFromCache } from "./hooks/useRecommendedCache";

// Preload LCP image from cache BEFORE React renders (improves LCP discovery)
preloadLCPFromCache();

// Defer non-critical CSS
import("./styles/animations.css");
import("./styles/effects.css");

createRoot(document.getElementById("root")!).render(<App />);
