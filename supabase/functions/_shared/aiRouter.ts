export interface RouteConfig {
  model: string;
  maxTokens: number;
  dollarCap: number;
}

export const ROUTES = {
  lite: {
    model: "google/gemini-2.5-flash-lite",
    maxTokens: 500,
    dollarCap: 0.01
  } as RouteConfig,
  deep: {
    model: "google/gemini-2.5-flash",
    maxTokens: 1000,
    dollarCap: 0.10
  } as RouteConfig
};

export const TOKEN_CAPS = {
  chat: 500,
  tradeAnalysis: 300,
  psychology: 400,
  reports: 800,
  widgets: 250,
  clarify: 300,
};

export interface ComplexityParams {
  promptLength: number;
  hasImages: boolean;
  tradesCount: number;
  keywords: string[];
}

/**
 * Classify request complexity to determine routing
 * Simple requests go to lite model, complex to deep
 */
export function classifyComplexity(params: ComplexityParams): 'simple' | 'complex' {
  const { promptLength, hasImages, tradesCount, keywords } = params;
  
  // Complex if images present
  if (hasImages) return 'complex';
  
  // Complex if analyzing many trades
  if (tradesCount > 5) return 'complex';
  
  // Complex if long prompt
  if (promptLength > 500) return 'complex';
  
  // Complex keywords
  const complexKeywords = [
    'explain why', 'derive', 'full report', 'detailed analysis',
    'comprehensive', 'in-depth', 'elaborate', 'breakdown'
  ];
  
  const promptText = keywords.join(' ').toLowerCase();
  const hasComplexKeyword = complexKeywords.some(kw => promptText.includes(kw));
  
  if (hasComplexKeyword) return 'complex';
  
  return 'simple';
}

/**
 * Select appropriate route based on complexity and budget constraints
 * forceLite overrides complexity for budget protection
 */
export function selectRoute(
  complexity: 'simple' | 'complex',
  forceLite: boolean
): RouteConfig {
  if (forceLite) return ROUTES.lite;
  return complexity === 'simple' ? ROUTES.lite : ROUTES.deep;
}

/**
 * Get token cap for specific endpoint
 */
export function getTokenCap(endpoint: string): number {
  const caps: Record<string, number> = {
    'ai-chat': TOKEN_CAPS.chat,
    'ai-trade-analysis': TOKEN_CAPS.tradeAnalysis,
    'ai-psychology-analysis': TOKEN_CAPS.psychology,
    'ai-generate-report': TOKEN_CAPS.reports,
    'ai-generate-widget': TOKEN_CAPS.widgets,
    'ai-widget-clarify': TOKEN_CAPS.clarify,
  };
  
  return caps[endpoint] || 500;
}
