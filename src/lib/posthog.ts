/**
 * PostHog Analytics Integration
 * EU-compliant, session recording enabled, privacy-focused
 */

import posthog from 'posthog-js';

export const initPostHog = () => {
  // Only initialize in production or if explicitly enabled
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_POSTHOG === 'true') {
    const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
    const host = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';

    if (!apiKey) {
      console.warn('[PostHog] API key not found, skipping initialization');
      return;
    }

    posthog.init(apiKey, {
      api_host: host,
      person_profiles: 'identified_only', // GDPR-friendly: only track identified users
      autocapture: false, // Manual event tracking for better control
      capture_pageview: false, // Manual pageview tracking
      capture_pageleave: true, // Track when users leave pages
      session_recording: {
        maskAllInputs: true, // Privacy: mask all input fields
        maskTextSelector: '[data-private]', // Custom privacy selector
        recordCrossOriginIframes: false,
      },
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          posthog.debug(); // Enable debug mode in development
        }
      },
    });

    console.log('[PostHog] Initialized successfully');
  }
};

export { posthog };
