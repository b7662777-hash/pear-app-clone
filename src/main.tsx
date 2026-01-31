import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// LCP preload now handled by inline script in index.html for earlier discovery

// Defer non-critical CSS to reduce main thread blocking
import("./styles/animations.css");
import("./styles/effects.css");

createRoot(document.getElementById("root")!).render(<App />);
