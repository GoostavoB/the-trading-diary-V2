// Analytics event tracking utilities
import { supabase } from '@/integrations/supabase/client';

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, properties);
  }
  console.log('Analytics event:', eventName, properties);
};

/**
 * Track streak-related events to user_events table
 */
export const trackStreakEvent = async (
  eventType: string,
  eventData: Record<string, any> = {}
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_events').insert({
      user_id: user.id,
      event_type: eventType,
      event_data: eventData
    });

    // Also track to external analytics
    trackEvent(eventType, eventData);
  } catch (error) {
    console.error('Failed to track streak event:', error);
  }
};

// Streak-specific event trackers
export const trackStreakEvents = {
  loginDay: (streak: number) => trackStreakEvent('streak_login_day', { streak }),
  tradeDay: (streak: number) => trackStreakEvent('streak_trade_day', { streak }),
  comboBonusAwarded: (loginStreak: number, tradeStreak: number) => 
    trackStreakEvent('streak_combo_bonus_awarded', { loginStreak, tradeStreak }),
  milestoneReached: (milestone: number, type: 'login' | 'trade') =>
    trackStreakEvent('streak_milestone_reached', { milestone, type }),
  streakBroken: (streak: number, type: 'login' | 'trade') =>
    trackStreakEvent('streak_broken', { streak, type }),
  reminderSent: (dayNumber: number, variant: string) =>
    trackStreakEvent('reminder_sent', { dayNumber, variant }),
  reminderClicked: (dayNumber: number) =>
    trackStreakEvent('reminder_clicked', { dayNumber }),
  reminderPaused: (afterDays: number) =>
    trackStreakEvent('reminder_paused', { afterDays }),
  freezeTokenUsed: (streak: number) =>
    trackStreakEvent('freeze_token_used', { streak }),
  reengagementSent: (daysInactive: number, lastStreak: number) =>
    trackStreakEvent('reengagement_sent', { daysInactive, lastStreak })
};

export const trackLandingEvents = {
  trackViewHome: () => trackEvent('track_view_home'),
  trackViewPricing: () => trackEvent('track_view_pricing'),
  trackCTAHeroClick: (source: string) => trackEvent('track_cta_hero_click', { source }),
  trackStartTrial: (plan: string) => trackEvent('start_trial', { plan }),
  trackWatchDemo: () => trackEvent('watch_demo'),
  trackUploadStarted: () => trackEvent('track_upload_started'),
  trackUploadCompleted: () => trackEvent('track_upload_completed'),
  trackWatchDemo50: () => trackEvent('track_watch_demo_50'),
  trackWatchDemo100: () => trackEvent('track_watch_demo_100'),
  trackSelectPlanClick: (plan: string) => trackEvent('track_select_plan_click', { plan }),
  trackCheckoutCompleted: (plan: string, amount: number) => 
    trackEvent('track_checkout_completed', { plan, amount }),
  trackEvent: (eventName: string, properties?: Record<string, any>) => trackEvent(eventName, properties),
};

export const trackUserJourney = {
  signupStarted: () => trackEvent('signup_started'),
  signupCompleted: (userId: string) => trackEvent('signup_completed', { userId }),
  planSelectionViewed: () => trackEvent('plan_selection_viewed'),
  planSelected: (plan: string) => trackEvent('plan_selected', { plan_name: plan }),
  checkoutStarted: (type: string, amount: number, priceId: string) => trackEvent('checkout_started', { type, amount, priceId }),
  checkoutSuccess: (type: string, amount: number) => trackEvent('checkout_success', { type, amount }),
  creditsChanged: (delta: number, reason: string, newBalance: number) => trackEvent('credits_changed', { delta, reason, newBalance }),
  uploadBlockedNoCredits: () => trackEvent('upload_blocked_no_credits'),
  paywallViewed: (feature: string) => trackEvent('paywall_viewed', { feature }),
  upgradeClicked: (source: string) => trackEvent('upgrade_clicked', { source }),
  creditsPurchaseViewed: () => trackEvent('credits_purchase_viewed'),
  upgradePageViewed: () => trackEvent('upgrade_page_viewed')
};
