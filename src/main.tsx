import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Defer non-critical CSS
import("./styles/animations.css");
import("./styles/effects.css");

createRoot(document.getElementById("root")!).render(<App />);
