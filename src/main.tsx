import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// LCP preload now handled by inline script in index.html for earlier discovery

// Defer non-critical CSS to reduce main thread blocking
import("./styles/animations.css");
import("./styles/effects.css");

// Use scheduler.yield pattern to break up long tasks and reduce Max Potential FID
// This yields to the main thread between React render and hydration
const root = document.getElementById("root")!;

// Schedule render with yielding to reduce long task duration
if ('scheduler' in window && 'yield' in (window as any).scheduler) {
  // Modern browsers with scheduler.yield()
  (window as any).scheduler.yield().then(() => {
    createRoot(root).render(<App />);
  });
} else {
  // Fallback: use setTimeout(0) to break up the long task
  // This allows the browser to handle any pending user input first
  setTimeout(() => {
    createRoot(root).render(<App />);
  }, 0);
}
