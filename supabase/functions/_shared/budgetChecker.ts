import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface BudgetStatus {
  allowed: boolean;
  forceLite: boolean;
  blocked: boolean;
  spendCents: number;
  budgetCents: number;
  percentUsed: number;
  message?: string;
}

/**
 * Check user's AI budget for the current month
 * Returns budget status and whether to force lite model or block
 */
export async function checkBudget(
  supabase: SupabaseClient,
  userId: string
): Promise<BudgetStatus> {
  const monthStart = new Date().toISOString().slice(0, 7) + '-01';
  
  const { data, error } = await supabase
    .from('user_ai_budget')
    .select('*')
    .eq('user_id', userId)
    .eq('month_start', monthStart)
    .single();
  
  if (error || !data) {
    // No budget row = starter plan with default $0.75 budget
    return {
      allowed: true,
      forceLite: false,
      blocked: false,
      spendCents: 0,
      budgetCents: 75, // $0.75 for starter
      percentUsed: 0
    };
  }
  
  const percentUsed = (data.spend_cents / data.budget_cents) * 100;
  
  // Block at 100%
  if (percentUsed >= 100) {
    return {
      allowed: false,
      forceLite: true,
      blocked: true,
      spendCents: data.spend_cents,
      budgetCents: data.budget_cents,
      percentUsed,
      message: "Monthly AI budget exhausted. Upgrade your plan to continue using AI features."
    };
  }
  
  // Force lite at 80%
  if (percentUsed >= 80) {
    return {
      allowed: true,
      forceLite: true,
      blocked: false,
      spendCents: data.spend_cents,
      budgetCents: data.budget_cents,
      percentUsed,
      message: "Approaching budget limit. Using cost-efficient models."
    };
  }
  
  return {
    allowed: true,
    forceLite: false,
    blocked: false,
    spendCents: data.spend_cents,
    budgetCents: data.budget_cents,
    percentUsed
  };
}

/**
 * Log AI cost and update monthly spend atomically
 */
export async function logCost(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  route: 'lite' | 'deep' | 'cached',
  modelId: string,
  tokensIn: number,
  tokensOut: number,
  costCents: number,
  latencyMs: number,
  options?: {
    cacheHit?: boolean;
    canary?: boolean;
    ocrQualityScore?: number;
    complexity?: 'simple' | 'complex';
    errorMessage?: string;
  }
): Promise<void> {
  try {
    // Insert into ai_cost_log
    await supabase.from('ai_cost_log').insert({
      user_id: userId,
      endpoint,
      route,
      model_id: modelId,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_cents: costCents,
      latency_ms: latencyMs,
      cache_hit: options?.cacheHit || false,
      canary: options?.canary || false,
      ocr_quality_score: options?.ocrQualityScore,
      complexity: options?.complexity,
      error_message: options?.errorMessage
    });
    
    // Update monthly spend (only if cost > 0)
    if (costCents > 0) {
      const monthStart = new Date().toISOString().slice(0, 7) + '-01';
      await supabase.rpc('increment_ai_spend', {
        p_user_id: userId,
        p_month_start: monthStart,
        p_cost_cents: costCents
      });
    }
  } catch (error) {
    console.error('Failed to log cost:', error);
    // Don't throw - logging should not block the main operation
  }
}

/**
 * Check rate limits for specific endpoint
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; message?: string }> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  // Rate limits specific to image extraction
  if (endpoint === 'extract-trade-info') {
    // Check hourly limit: max 10 images/hour
    const { count: hourCount } = await supabase
      .from('ai_cost_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('created_at', oneHourAgo.toISOString());

    if (hourCount && hourCount >= 10) {
      return { 
        allowed: false, 
        message: 'Rate limit exceeded: Maximum 10 images per hour. Please try again later.' 
      };
    }

    // Check minute limit: max 5 images/minute
    const { count: minCount } = await supabase
      .from('ai_cost_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('created_at', oneMinuteAgo.toISOString());

    if (minCount && minCount >= 5) {
      return { 
        allowed: false, 
        message: 'Rate limit exceeded: Maximum 5 images per minute. Please slow down.' 
      };
    }
  }

  return { allowed: true };
}
