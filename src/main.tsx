import { createRoot } from "react-dom/client";
import "./i18n"; // Initialize i18n before App
// Removed duplicate i18n config to prevent overriding resources
import App from "./App";
import "./index.css";
import { reportWebVitals, sendVitalsToAnalytics } from "./utils/webVitals";
import { setupGlobalErrorHandling } from "./utils/errorTracking";
import { registerSW } from 'virtual:pwa-register';

// Set up global error tracking
setupGlobalErrorHandling();

// After a new deploy, an already-open tab holds references to chunks that no
// longer exist — a lazy-route click then fails silently and looks "dead".
// Vite fires `vite:preloadError` for that; reload once to fetch fresh assets.
window.addEventListener("vite:preloadError", () => {
    window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);

const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
          if (registration) {
                  setInterval(() => {
                            registration.update();
                  }, 60000);
          }
    },
    onNeedRefresh() {
          updateSW(true);
    },
});

// Phase 7: Defer analytics until after page is interactive
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    reportWebVitals(sendVitalsToAnalytics);
  }, { timeout: 2000 });
} else {
  setTimeout(() => {
    reportWebVitals(sendVitalsToAnalytics);
  }, 2000);
}
