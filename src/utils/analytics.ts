/**
 * Unified Analytics Service
 * Integrates: PostHog (primary), Google Analytics (legacy), Mixpanel (optional)
 */

import { posthog } from '@/lib/posthog';
import { getMixpanel } from '@/lib/mixpanel';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export type EventCategory = 
  | 'engagement'
  | 'conversion'
  | 'navigation'
  | 'trading'
  | 'content'
  | 'social'
  | 'gamification'; // NEW: For XP/tier events

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export class Analytics {
  private enabled = false;
  private queue: AnalyticsEvent[] = [];

  init() {
    if (import.meta.env.PROD) {
      this.enabled = true;
      this.flushQueue();
    }
  }

  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
    };

    if (this.enabled) {
      this.sendEvent(analyticsEvent);
    } else {
      this.queue.push(analyticsEvent);
    }

    if (import.meta.env.DEV) {
      console.log('[Analytics]', event, properties);
    }
  }

  page(path: string, properties?: Record<string, any>) {
    this.track('page_view', { path, ...properties });
    
    // PostHog manual pageview
    if (typeof posthog?.capture === 'function') {
      posthog.capture('$pageview', { path, ...properties });
    }
  }

  identify(userId: string, traits?: Record<string, any>) {
    // PostHog identification
    if (typeof posthog?.identify === 'function') {
      posthog.identify(userId, traits);
    }

    // Mixpanel identification (if enabled)
    const mixpanel = getMixpanel();
    if (mixpanel) {
      mixpanel.identify(userId);
      if (traits) {
        mixpanel.people.set(traits);
      }
    }

    this.track('identify', { userId, ...traits });
  }

  setUserProperties(properties: Record<string, any>) {
    // PostHog user properties
    if (typeof posthog?.setPersonProperties === 'function') {
      posthog.setPersonProperties(properties);
    }

    // Google Analytics user properties
    if (typeof window.gtag === 'function') {
      window.gtag('set', 'user_properties', properties);
    }

    // Mixpanel user properties
    const mixpanel = getMixpanel();
    if (mixpanel) {
      mixpanel.people.set(properties);
    }
    
    this.track('user_properties_set', properties);
  }

  // ============ GAMIFICATION-SPECIFIC EVENTS ============

  trackXPAwarded(params: {
    amount: number;
    activityType: string;
    description?: string;
    multiplier?: number;
    totalXP: number;
    currentLevel: number;
  }) {
    this.track('xp_awarded', {
      xp_amount: params.amount,
      activity_type: params.activityType,
      description: params.description,
      streak_multiplier: params.multiplier || 1,
      total_xp: params.totalXP,
      current_level: params.currentLevel,
      event_category: 'gamification',
    });
  }

  trackTierUnlocked(params: {
    tier: number;
    totalXP: number;
    previousTier: number;
  }) {
    this.track('tier_unlocked', {
      tier: params.tier,
      total_xp: params.totalXP,
      previous_tier: params.previousTier,
      event_category: 'gamification',
    });
  }

  trackDailyXPCapReached(params: {
    dailyXP: number;
    capLimit: number;
    planType: string;
  }) {
    this.track('daily_xp_cap_reached', {
      daily_xp: params.dailyXP,
      cap_limit: params.capLimit,
      plan_type: params.planType,
      event_category: 'conversion',
    });
  }

  trackWidgetLocked(params: {
    widgetName: string;
    requiredTier: number;
    currentTier: number;
    tierGap: number;
  }) {
    this.track('widget_locked_clicked', {
      widget_name: params.widgetName,
      required_tier: params.requiredTier,
      current_tier: params.currentTier,
      tier_gap: params.tierGap,
      event_category: 'gamification',
    });
  }

  trackTier3PreviewOpened(params: {
    totalXP: number;
    currentTier: number;
  }) {
    this.track('tier_3_preview_opened', {
      total_xp: params.totalXP,
      current_tier: params.currentTier,
      event_category: 'conversion',
    });
  }

  trackUpgradeModalOpened(params: {
    source: 'widget_lock' | 'xp_cap' | 'tier_preview' | 'upload_limit';
    currentPlan: string;
    currentTier?: number;
  }) {
    this.track('upgrade_modal_opened', {
      source: params.source,
      current_plan: params.currentPlan,
      current_tier: params.currentTier,
      event_category: 'conversion',
    });
  }

  trackUpgradeCompleted(params: {
    fromPlan: string;
    toPlan: string;
    revenue: number;
    source?: string;
  }) {
    this.track('upgrade_completed', {
      from_plan: params.fromPlan,
      to_plan: params.toPlan,
      revenue: params.revenue,
      source: params.source,
      event_category: 'conversion',
    });
  }

  // ============ LEGACY METHODS (kept for backward compatibility) ============

  performance(metric: string, value: number, properties?: Record<string, any>) {
    this.track('performance', {
      metric,
      value,
      ...properties,
    });
  }

  error(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  trackArticleView(articleSlug: string, articleTitle: string, category: string) {
    this.track('view_item', {
      content_type: 'article',
      item_id: articleSlug,
      item_name: articleTitle,
      item_category: category,
    });

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'view_item', {
        content_type: 'article',
        item_id: articleSlug,
        item_name: articleTitle,
        item_category: category,
      });
    }
  }

  trackArticleProgress(articleSlug: string, progressPercent: number) {
    if (progressPercent === 25 || progressPercent === 50 || progressPercent === 75 || progressPercent === 100) {
      this.track('article_progress', {
        article_slug: articleSlug,
        progress_percent: progressPercent,
      });
    }
  }

  trackEvent({ action, category, label, value, ...params }: {
    action: string;
    category: EventCategory;
    label?: string;
    value?: number;
    [key: string]: any;
  }) {
    this.track(action, {
      event_category: category,
      event_label: label,
      value: value,
      ...params,
    });

    if (typeof window.gtag === 'function') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        ...params,
      });
    }
  }

  private sendEvent(event: AnalyticsEvent) {
    // PostHog
    if (typeof posthog?.capture === 'function') {
      posthog.capture(event.event, event.properties);
    }

    // Google Analytics
    if (typeof window.gtag === 'function') {
      window.gtag('event', event.event, event.properties);
    }

    // Mixpanel (if enabled)
    const mixpanel = getMixpanel();
    if (mixpanel) {
      mixpanel.track(event.event, event.properties);
    }
  }

  private flushQueue() {
    this.queue.forEach(event => this.sendEvent(event));
    this.queue = [];
  }
}

export const analytics = new Analytics();

export const trackPageView = (path: string, title?: string) => analytics.page(path, { page_title: title });
export const trackArticleView = (slug: string, title: string, category: string) => analytics.trackArticleView(slug, title, category);
