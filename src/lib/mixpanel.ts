/**
 * Mixpanel Analytics Integration (Optional)
 * Feature-flagged for A/B testing
 * Note: Mixpanel package is not installed by default
 * Install with: npm install mixpanel-browser
 */

interface MixpanelStub {
  init: (token: string, config?: any) => void;
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string) => void;
  people: {
    set: (properties: Record<string, any>) => void;
  };
}

let mixpanel: MixpanelStub | null = null;

export const initMixpanel = async () => {
  const enabled = import.meta.env.VITE_ENABLE_MIXPANEL === 'true';
  const token = import.meta.env.VITE_MIXPANEL_TOKEN;

  if (!enabled || !token) {
    console.log('[Mixpanel] Not enabled or token missing, skipping');
    return;
  }

  try {
    // Dynamic import to avoid loading if not needed
    // This will fail silently if mixpanel-browser is not installed
    // @ts-expect-error - mixpanel-browser is optional and only installed when feature flag is enabled
    const mixpanelModule = await import('mixpanel-browser').catch(() => null);
    
    if (!mixpanelModule) {
      console.warn('[Mixpanel] Package not installed. Install with: npm install mixpanel-browser');
      return;
    }

    mixpanel = mixpanelModule.default;

    mixpanel.init(token, {
      debug: import.meta.env.DEV,
      track_pageview: false, // Manual tracking
      persistence: 'localStorage',
    });

    console.log('[Mixpanel] Initialized successfully');
  } catch (error) {
    console.error('[Mixpanel] Failed to initialize:', error);
  }
};

export const getMixpanel = (): MixpanelStub | null => mixpanel;
