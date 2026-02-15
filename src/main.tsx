import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/article.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker for image caching & offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[SW] registered, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] registration failed:', err);
      });
  });
}
