import { createRoot, hydrateRoot } from "react-dom/client";
import "./i18n"; // Initialize i18n before App
// Removed duplicate i18n config to prevent overriding resources
import App from "./App.tsx";
import "./index.css";
import { reportWebVitals, sendVitalsToAnalytics } from "./utils/webVitals";
import { setupGlobalErrorHandling } from "./utils/errorTracking";
import { swCleanup } from "./utils/swCleanup";
import { initPostHog } from "./lib/posthog";
import { HelmetProvider } from "react-helmet-async";
import { setupLazyLoading, optimizeImageLoading, addResourceHints, prefetchRoutes } from "./utils/coreWebVitals";

// Set up global error tracking
setupGlobalErrorHandling();

// Initialize PostHog analytics
initPostHog();

// Declare global BUILD_ID
declare const __BUILD_ID__: string;

// FORCE aggressive cache cleanup for subscription refactor
console.log('[Cache] FORCING aggressive cleanup for subscription system refactor');
swCleanup();

// Force cache cleanup on new builds or manual trigger
const currentBuildId = __BUILD_ID__;
const storedBuildId = localStorage.getItem('build-id');
const forceCleanup = 
  window.location.search.includes('no-sw=1') || 
  window.location.hash.includes('no-sw');

if (storedBuildId !== currentBuildId || forceCleanup) {
  console.log('[Cache] New build detected or cleanup forced, clearing caches...');
  localStorage.setItem('build-id', currentBuildId);
}

// Update build ID
localStorage.setItem('build-id', currentBuildId);

// Initialize Core Web Vitals optimizations
optimizeImageLoading();
addResourceHints();

// Setup lazy loading after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupLazyLoading();
    prefetchRoutes(['/auth', '/pricing', '/blog']);
  });
} else {
  setupLazyLoading();
  prefetchRoutes(['/auth', '/pricing', '/blog']);
}

// React-Snap SSR support: hydrate if pre-rendered, render if not
const rootElement = document.getElementById("root")!;
const app = (
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}

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
