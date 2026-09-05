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

// Recover once when an open tab references a route chunk removed by a deploy.
// The session guard prevents a reload loop when the failure has another cause;
// the app-level ErrorBoundary then provides visible recovery actions.
const PRELOAD_RELOAD_KEY = 'vite-preload-reload-attempted-at';
const PRELOAD_RELOAD_COOLDOWN_MS = 10_000;
window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    const previousAttempt = Number(sessionStorage.getItem(PRELOAD_RELOAD_KEY) ?? 0);
    if (Date.now() - previousAttempt < PRELOAD_RELOAD_COOLDOWN_MS) return;
    sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()));
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
