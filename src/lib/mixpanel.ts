/**
 * Mixpanel Analytics Integration (Placeholder)
 * 
 * NOTE: Mixpanel is currently disabled to avoid build issues.
 * To enable Mixpanel:
 * 1. Install: npm install mixpanel-browser
 * 2. Add env vars: VITE_ENABLE_MIXPANEL=true, VITE_MIXPANEL_TOKEN=your_token
 * 3. Uncomment the code below
 * 4. Import and call initMixpanel() in src/main.tsx
 */

interface MixpanelStub {
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string) => void;
  people: {
    set: (properties: Record<string, any>) => void;
  };
}

// Stub implementation - does nothing until real Mixpanel is installed
const mixpanelStub: MixpanelStub = {
  track: () => {},
  identify: () => {},
  people: {
    set: () => {},
  },
};

export const initMixpanel = async () => {
  console.log('[Mixpanel] Disabled - install mixpanel-browser to enable');
};

export const getMixpanel = (): MixpanelStub => mixpanelStub;

/*
// UNCOMMENT WHEN MIXPANEL IS INSTALLED:

import mixpanel from 'mixpanel-browser';

let mixpanelInstance: typeof mixpanel | null = null;

export const initMixpanel = async () => {
  const enabled = import.meta.env.VITE_ENABLE_MIXPANEL === 'true';
  const token = import.meta.env.VITE_MIXPANEL_TOKEN;

  if (!enabled || !token) {
    console.log('[Mixpanel] Not enabled or token missing');
    return;
  }

  mixpanel.init(token, {
    debug: import.meta.env.DEV,
    track_pageview: false,
    persistence: 'localStorage',
  });

  mixpanelInstance = mixpanel;
  console.log('[Mixpanel] Initialized successfully');
};

export const getMixpanel = () => mixpanelInstance;
*/
