import { createRoot } from "react-dom/client";
import "./i18n"; // Initialize i18n before App
// Removed duplicate i18n config to prevent overriding resources
import App from "./App.tsx";
import "./index.css";
import { reportWebVitals, sendVitalsToAnalytics } from "./utils/webVitals";
import { setupGlobalErrorHandling } from "./utils/errorTracking";
import { swCleanup } from "./utils/swCleanup";
import { initPostHog } from "./lib/posthog";

// Set up global error tracking
setupGlobalErrorHandling();

// Initialize PostHog analytics
initPostHog();

// Declare global BUILD_ID
declare const __BUILD_ID__: string;

// Force cache cleanup on new builds or manual trigger
const currentBuildId = __BUILD_ID__;
const storedBuildId = localStorage.getItem('build-id');
const forceCleanup = 
  window.location.search.includes('no-sw=1') || 
  window.location.hash.includes('no-sw');

if (storedBuildId !== currentBuildId || forceCleanup) {
  console.log('[Cache] New build detected or cleanup forced, clearing caches...');
  swCleanup();
  localStorage.setItem('build-id', currentBuildId);
}

createRoot(document.getElementById("root")!).render(<App />);

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
