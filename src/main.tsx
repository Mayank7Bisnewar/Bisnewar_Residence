import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAdMob } from "./lib/admob.ts";

initializeAdMob();

createRoot(document.getElementById("root")!).render(<App />);
