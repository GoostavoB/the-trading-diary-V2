import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface BudgetStatus {
  allowed: boolean;
  forceLite: boolean;
  blocked: boolean;
  spendCents: number;
  budgetCents: number;
  percentUsed: number;
  message?: string;
  isAdmin?: boolean;
}

/**
 * Structured log for budget check
 */
function logBudgetCheck(params: {
  userId: string;
  emailNormalized?: string;
  isAdmin: boolean;
  availableCreditsBefore: number;
  decision: 'allow' | 'block' | 'force_lite';
  reason?: string;
}) {
  console.log(JSON.stringify({
    type: 'budget_check',
    timestamp: new Date().toISOString(),
    ...params
  }));
}

/**
 * Check user's AI budget for the current month
 * Returns budget status and whether to force lite model or block
 * IMPORTANT: Admins are never blocked
 */
export async function checkBudget(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string
): Promise<BudgetStatus> {
  const monthStart = new Date().toISOString().slice(0, 7) + '-01';

  // Check if user is admin FIRST (admin bypass)
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();

  const isAdmin = roleData?.role === 'admin';
  const emailNormalized = userEmail?.toLowerCase();

  if (isAdmin) {
    logBudgetCheck({
      userId,
      emailNormalized,
      isAdmin: true,
      availableCreditsBefore: 999999,
      decision: 'allow',
      reason: 'admin_bypass'
    });

    return {
      allowed: true,
      forceLite: false,
      blocked: false,
      spendCents: 0,
      budgetCents: 999999, // Unlimited for admin
      percentUsed: 0,
      isAdmin: true,
      message: 'Admin access - unlimited budget'
    };
  }

  // Regular user budget check
  const { data, error } = await supabase
    .from('user_ai_budget')
    .select('*')
    .eq('user_id', userId)
    .eq('month_start', monthStart)
    .single();

  if (error || !data) {
    // No budget row = starter plan with default $0.75 budget
    logBudgetCheck({
      userId,
      emailNormalized,
      isAdmin: false,
      availableCreditsBefore: 75,
      decision: 'allow',
      reason: 'default_starter_budget'
    });

    return {
      allowed: true,
      forceLite: false,
      blocked: false,
      spendCents: 0,
      budgetCents: 75, // $0.75 for starter
      percentUsed: 0,
      isAdmin: false
    };
  }

  const percentUsed = (data.spend_cents / data.budget_cents) * 100;
  const availableCreditsBefore = data.budget_cents - data.spend_cents;

  // Block at 100%
  if (percentUsed >= 100) {
    logBudgetCheck({
      userId,
      emailNormalized,
      isAdmin: false,
      availableCreditsBefore,
      decision: 'block',
      reason: 'budget_exhausted_100_percent'
    });

    return {
      allowed: false,
      forceLite: true,
      blocked: true,
      spendCents: data.spend_cents,
      budgetCents: data.budget_cents,
      percentUsed,
      isAdmin: false,
      message: "Monthly AI budget exhausted. Upgrade your plan to continue using AI features."
    };
  }

  // Force lite at 80%
  if (percentUsed >= 80) {
    logBudgetCheck({
      userId,
      emailNormalized,
      isAdmin: false,
      availableCreditsBefore,
      decision: 'force_lite',
      reason: 'budget_warning_80_percent'
    });

    return {
      allowed: true,
      forceLite: true,
      blocked: false,
      spendCents: data.spend_cents,
      budgetCents: data.budget_cents,
      percentUsed,
      isAdmin: false,
      message: "Approaching budget limit. Using cost-efficient models."
    };
  }

  logBudgetCheck({
    userId,
    emailNormalized,
    isAdmin: false,
    availableCreditsBefore,
    decision: 'allow',
    reason: 'sufficient_budget'
  });

  return {
    allowed: true,
    forceLite: false,
    blocked: false,
    spendCents: data.spend_cents,
    budgetCents: data.budget_cents,
    percentUsed,
    isAdmin: false
  };
}

/**
 * Structured log for cost deduction
 */
function logCostDeduction(params: {
  userId: string;
  endpoint: string;
  route: string;
  modelId: string;
  debitAmount: number;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  cacheHit: boolean;
  success: boolean;
  errorMessage?: string;
}) {
  console.log(JSON.stringify({
    type: 'cost_deduction',
    timestamp: new Date().toISOString(),
    ...params
  }));
}

/**
 * Generate idempotency key for cost logging
 */
function generateIdempotencyKey(
  userId: string,
  endpoint: string,
  imageHash?: string,
  requestId?: string
): string {
  const timestamp = new Date().toISOString();
  const uniquePart = imageHash || requestId || Math.random().toString(36).substring(7);
  return `${userId}:${endpoint}:${timestamp}:${uniquePart}`;
}

/**
 * Log AI cost and update monthly spend atomically with idempotency
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
    idempotencyKey?: string;
    requestId?: string;
    imageHash?: string;
  }
): Promise<{ logged: boolean; alreadyExists: boolean }> {
  const cacheHit = options?.cacheHit || false;
  const idempotencyKey = options?.idempotencyKey ||
    generateIdempotencyKey(userId, endpoint, options?.imageHash, options?.requestId);

  try {
    // Check if entry already exists (idempotent retry)
    const { data: existing } = await supabase
      .from('ai_cost_log')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existing) {
      console.log('Idempotent retry detected - skipping duplicate cost log:', idempotencyKey);
      logCostDeduction({
        userId,
        endpoint,
        route,
        modelId,
        debitAmount: 0,
        tokensIn: 0,
        tokensOut: 0,
        latencyMs: 0,
        cacheHit: true,
        success: true,
        errorMessage: 'Idempotent retry - already logged'
      });
      return { logged: false, alreadyExists: true };
    }

    // Insert into ai_cost_log with idempotency key
    await supabase.from('ai_cost_log').insert({
      idempotency_key: idempotencyKey,
      request_id: options?.requestId,
      user_id: userId,
      endpoint,
      route,
      model_id: modelId,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_cents: costCents,
      latency_ms: latencyMs,
      cache_hit: cacheHit,
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

    logCostDeduction({
      userId,
      endpoint,
      route,
      modelId,
      debitAmount: costCents,
      tokensIn,
      tokensOut,
      latencyMs,
      cacheHit,
      success: true
    });

    return { logged: true, alreadyExists: false };
  } catch (error) {
    logCostDeduction({
      userId,
      endpoint,
      route,
      modelId,
      debitAmount: costCents,
      tokensIn,
      tokensOut,
      latencyMs,
      cacheHit,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error)
    });

    console.error('Failed to log cost:', error);
    // Don't throw - logging should not block the main operation
    return { logged: false, alreadyExists: false };
  }
}

/**
 * Check rate limits for specific endpoint
 * Admins are exempt from rate limits
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; message?: string; isAdmin?: boolean }> {
  // Check if user is admin FIRST (admin bypass)
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();

  const isAdmin = roleData?.role === 'admin';

  if (isAdmin) {
    console.log('🔓 Admin bypass - rate limit check skipped');
    return { allowed: true, isAdmin: true };
  }

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
