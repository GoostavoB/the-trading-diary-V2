/**
 * Pricing Calculator - Complete Cost Structure
 * Estrutura completa de custos para precificação por usuário e por upload
 */

// ============================================
// PARÂMETROS BASE
// ============================================

export const PRICING_PARAMETERS = {
  // Custos de AI por tipo de chamada
  ai_costs: {
    // Lovable AI - google/gemini-2.5-flash (modelo padrão)
    gemini_flash: {
      input_per_1k_tokens: 0.000075,  // $0.075 per 1M tokens
      output_per_1k_tokens: 0.0003,   // $0.30 per 1M tokens
    },
    // Lovable AI - google/gemini-2.5-pro (análises complexas)
    gemini_pro: {
      input_per_1k_tokens: 0.00125,   // $1.25 per 1M tokens
      output_per_1k_tokens: 0.005,    // $5.00 per 1M tokens
    },
    // OCR via Tesseract.js (processado localmente, custo de compute)
    ocr_processing: 0.002,             // $0.002 por imagem processada
  },

  // Tokens médios por tipo de evento
  token_usage: {
    // extract-trade-info (screenshot upload)
    extract_trade_lite: {
      avg_input_tokens: 1200,          // OCR text + prompt
      avg_output_tokens: 300,          // JSON estruturado
      p95_input_tokens: 2000,
      p95_output_tokens: 500,
      model: 'gemini_flash',
    },
    extract_trade_deep: {
      avg_input_tokens: 2500,          // Análise complexa
      avg_output_tokens: 800,
      p95_input_tokens: 4000,
      p95_output_tokens: 1500,
      model: 'gemini_pro',
    },
    
    // ai-trade-analysis (análise de performance)
    trade_analysis: {
      avg_input_tokens: 1800,          // Histórico + contexto
      avg_output_tokens: 600,          // Insights + ações
      p95_input_tokens: 3000,
      p95_output_tokens: 1200,
      model: 'gemini_flash',
    },
    
    // ai-generate-report (relatório semanal)
    weekly_report: {
      avg_input_tokens: 3500,          // Dados completos da semana
      avg_output_tokens: 1500,         // Relatório detalhado
      p95_input_tokens: 5000,
      p95_output_tokens: 2500,
      model: 'gemini_flash',
    },
    
    // ai-chat (assistente conversacional)
    chat_message: {
      avg_input_tokens: 800,           // Mensagem + contexto
      avg_output_tokens: 400,          // Resposta
      p95_input_tokens: 1500,
      p95_output_tokens: 800,
      model: 'gemini_flash',
    },
    
    // ai-generate-widget (criação de widget customizado)
    generate_widget: {
      avg_input_tokens: 1000,
      avg_output_tokens: 1200,         // Código + explicação
      p95_input_tokens: 1800,
      p95_output_tokens: 2000,
      model: 'gemini_flash',
    },
    
    // ai-dashboard-assistant (sugestões de dashboard)
    dashboard_assistant: {
      avg_input_tokens: 1200,
      avg_output_tokens: 500,
      p95_input_tokens: 2000,
      p95_output_tokens: 900,
      model: 'gemini_flash',
    },
  },

  // Taxas de retry e cache
  reliability: {
    retry_rate_upload: 0.08,           // 8% dos uploads precisam retry
    retry_rate_analysis: 0.05,         // 5% das análises precisam retry
    cache_hit_rate_widget: 0.65,       // 65% dos widgets são servidos do cache
  },

  // Imagens
  image_processing: {
    avg_images_per_trade: 1.2,         // Média de imagens por trade
    avg_image_size_mb: 0.8,            // Tamanho médio após compressão
    p95_image_size_mb: 2.5,            // P95 de tamanho
    storage_redundancy: 1.5,           // Fator de redundância (geo-replication)
    thumbnail_variants: 3,             // Número de thumbnails gerados
  },

  // Taxas de pagamento (Stripe)
  payment_fees: {
    stripe_percent: 0.029,             // 2.9%
    stripe_fixed_usd: 0.30,            // $0.30 por transação
    fx_markup: 0.01,                   // 1% para conversão de moeda
    chargeback_rate: 0.004,            // 0.4% de chargebacks
    avg_chargeback_cost: 15.00,        // Custo médio de chargeback
  },
} as const;

// ============================================
// CUSTOS DE INFRAESTRUTURA
// ============================================

export const INFRASTRUCTURE_COSTS = {
  // Supabase Database (via Lovable Cloud)
  database: {
    // Pro plan estimado
    monthly_base: 25.00,               // Base do plano
    storage_per_gb_month: 0.125,       // $0.125 por GB-mês
    avg_storage_per_user_gb: 0.5,      // 500MB médio por usuário
    storage_growth_monthly: 0.1,       // +100MB por mês por usuário ativo
    egress_per_gb: 0.09,               // $0.09 por GB de egress
    avg_egress_per_user_month_gb: 0.2, // 200MB de egress/usuário/mês
    iops_included: 40000,              // IOPS incluídos no plano
    backup_retention_days: 7,          // Dias de backup
  },

  // Object Storage (Supabase Storage)
  storage: {
    storage_per_gb_month: 0.021,       // $0.021 por GB-mês
    get_per_1k: 0.0004,                // $0.0004 por 1k GET requests
    put_per_1k: 0.005,                 // $0.005 por 1k PUT requests
    avg_storage_per_trade_mb: 1.5,     // Storage médio por trade
    avg_gets_per_user_month: 500,      // Requests GET médios
    avg_puts_per_user_month: 50,       // Requests PUT médios
  },

  // CDN e Egress
  cdn: {
    requests_per_1m: 1.00,             // $1 por 1M requests
    traffic_per_gb: 0.12,              // $0.12 por GB
    cache_hit_rate: 0.75,              // 75% cache hit rate
    avg_requests_per_user_month: 2000, // Requests médios por usuário
    avg_traffic_per_user_gb: 0.5,      // 500MB de tráfego/usuário
  },

  // Auth e Realtime (Supabase)
  services: {
    auth_mau_included: 50000,          // MAU incluídos
    auth_cost_per_mau_above: 0.00325,  // $0.00325 por MAU adicional
    realtime_monthly: 10.00,           // Custo base de realtime
    realtime_connections_included: 500,
    realtime_cost_per_100_extra: 10.00,
  },

  // Edge Functions (via Lovable Cloud)
  edge_functions: {
    invocations_per_1m: 2.00,          // $2 por 1M invocations
    compute_gb_sec: 0.0000185,         // $0.0000185 por GB-segundo
    avg_duration_ms: 800,              // Duração média de função
    avg_memory_mb: 256,                // Memória média
  },
} as const;

// ============================================
// CUSTOS FIXOS POR USUÁRIO
// ============================================

export const FIXED_COSTS_PER_USER = {
  monthly: {
    support_allocation: 2.00,          // Alocação de suporte por usuário
    monitoring_logs: 0.50,             // Monitoramento e logs
    email_service: 0.30,               // Serviço de e-mail (transacional)
    backup_snapshot: 0.25,             // Backups e snapshots
    security_scanning: 0.20,           // Scanning de segurança
    cdn_base_allocation: 0.50,         // Alocação base de CDN
  },
  total_monthly: 3.75,                 // Total de custos fixos/usuário/mês
} as const;

// ============================================
// CUSTOS FIXOS GLOBAIS (não por usuário)
// ============================================

export const FIXED_COSTS_GLOBAL = {
  monthly: {
    domain_ssl: 15.00,                 // Domínio + SSL
    error_tracking: 29.00,             // Sentry ou similar
    uptime_monitoring: 19.00,          // Uptime monitoring
    analytics: 0.00,                   // Plausible/analytics (free tier)
    ci_cd: 0.00,                       // CI/CD via Lovable (incluído)
    development_tools: 50.00,          // Ferramentas de desenvolvimento
    compliance_legal: 100.00,          // Compliance e legal
  },
  total_monthly: 213.00,               // Total de custos fixos globais/mês
} as const;

// ============================================
// VOLUMES BASE POR PLANO
// ============================================

export const PLAN_VOLUMES = {
  free: {
    trades_per_month: 10,              // 10 trades/mês
    ai_uploads_per_month: 5,           // 5 uploads com AI
    analyses_per_week: 1,              // 1 análise semanal
    exchanges: 1,                      // 1 exchange
    chat_messages_per_month: 20,       // 20 mensagens de chat
    weekly_reports: 0,                 // Sem relatórios
    custom_widgets: 0,                 // Sem widgets customizados
    dashboard_customization: false,    // Sem customização
  },
  basic: {
    trades_per_month: 50,
    ai_uploads_per_month: 50,          // Todas as 50 podem ser AI
    analyses_per_week: 4,              // 1 por semana
    exchanges: 1,
    chat_messages_per_month: 100,
    weekly_reports: 4,                 // 1 por semana
    custom_widgets: 0,
    dashboard_customization: false,
  },
  pro: {
    trades_per_month: 1000,
    ai_uploads_per_month: 1000,
    analyses_per_week: 8,              // 2 por semana
    exchanges: 3,
    chat_messages_per_month: 500,
    weekly_reports: 4,
    custom_widgets: 5,
    dashboard_customization: true,
  },
  elite: {
    trades_per_month: 5000,
    ai_uploads_per_month: 5000,
    analyses_per_week: 20,             // 5 por semana
    exchanges: 5,
    chat_messages_per_month: 2000,
    weekly_reports: 4,
    custom_widgets: 20,
    dashboard_customization: true,
    team_seats: 3,                     // 3 assentos de equipe
  },
} as const;

// ============================================
// PLANOS E PREÇOS
// ============================================

export const PLANS = {
  free: {
    name: 'Free',
    price_monthly_usd: 0,
    price_yearly_usd: 0,
    target_margin_percent: 0,          // Plano de aquisição
    description: 'New traders validating a system',
  },
  basic: {
    name: 'Basic',
    price_monthly_usd: 19,
    price_yearly_usd: 190,             // 2 meses grátis (19 * 10)
    target_margin_percent: 60,         // 60% de margem alvo
    description: 'New traders validating a system',
  },
  pro: {
    name: 'Pro',
    price_monthly_usd: 49,
    price_yearly_usd: 490,             // 2 meses grátis (49 * 10)
    target_margin_percent: 70,         // 70% de margem alvo
    description: 'Active traders optimizing risk and costs',
    recommended: true,
  },
  elite: {
    name: 'Elite',
    price_monthly_usd: 149,
    price_yearly_usd: 1490,            // 2 meses grátis (149 * 10)
    target_margin_percent: 75,         // 75% de margem alvo
    description: 'Professional traders needing advanced analysis and reports',
  },
} as const;

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

/**
 * Calcula custo de AI por evento
 */
export function calculateAICost(
  eventType: keyof typeof PRICING_PARAMETERS.token_usage,
  useP95 = false
): number {
  const usage = PRICING_PARAMETERS.token_usage[eventType];
  const model = PRICING_PARAMETERS.ai_costs[usage.model];
  
  const inputTokens = useP95 ? usage.p95_input_tokens : usage.avg_input_tokens;
  const outputTokens = useP95 ? usage.p95_output_tokens : usage.avg_output_tokens;
  
  const inputCost = (inputTokens / 1000) * model.input_per_1k_tokens;
  const outputCost = (outputTokens / 1000) * model.output_per_1k_tokens;
  
  return inputCost + outputCost;
}

/**
 * Calcula custo de processamento de imagem completo
 */
export function calculateImageCost(): number {
  const { avg_images_per_trade, avg_image_size_mb, storage_redundancy, thumbnail_variants } = 
    PRICING_PARAMETERS.image_processing;
  
  // OCR processing
  const ocrCost = avg_images_per_trade * PRICING_PARAMETERS.ai_costs.ocr_processing;
  
  // Storage (assumindo armazenamento por 12 meses)
  const storageCost = avg_images_per_trade * avg_image_size_mb * storage_redundancy * 
    INFRASTRUCTURE_COSTS.storage.storage_per_gb_month * 12 / 1024;
  
  // Thumbnails storage
  const thumbSize = 0.05; // 50KB por thumbnail
  const thumbStorageCost = avg_images_per_trade * thumbnail_variants * thumbSize * 
    INFRASTRUCTURE_COSTS.storage.storage_per_gb_month * 12 / 1024;
  
  // PUT requests
  const putCost = (avg_images_per_trade * (1 + thumbnail_variants) / 1000) * 
    INFRASTRUCTURE_COSTS.storage.put_per_1k;
  
  return ocrCost + storageCost + thumbStorageCost + putCost;
}

/**
 * Calcula custo por trade (upload + processamento + storage)
 */
export function calculateCostPerTrade(useDeepAnalysis = false): number {
  const extractionType = useDeepAnalysis ? 'extract_trade_deep' : 'extract_trade_lite';
  const aiCost = calculateAICost(extractionType);
  const imageCost = calculateImageCost();
  const retryMultiplier = 1 + PRICING_PARAMETERS.reliability.retry_rate_upload;
  
  return (aiCost + imageCost) * retryMultiplier;
}

/**
 * Calcula custo total mensal por usuário em um plano específico
 */
export function calculateMonthlyCostPerUser(
  tier: keyof typeof PLAN_VOLUMES
): {
  fixed: number;
  variable: number;
  total: number;
  breakdown: Record<string, number>;
} {
  const volumes = PLAN_VOLUMES[tier];
  const retryMultiplier = 1 + PRICING_PARAMETERS.reliability.retry_rate_analysis;
  
  // Custos fixos
  const fixedCosts = FIXED_COSTS_PER_USER.total_monthly;
  
  // Custos variáveis
  const tradeCosts = volumes.ai_uploads_per_month * calculateCostPerTrade();
  const analysisCosts = volumes.analyses_per_week * 4 * 
    calculateAICost('trade_analysis') * retryMultiplier;
  const chatCosts = volumes.chat_messages_per_month * calculateAICost('chat_message');
  const reportCosts = volumes.weekly_reports * calculateAICost('weekly_report');
  const widgetCosts = volumes.custom_widgets * calculateAICost('generate_widget') *
    (1 - PRICING_PARAMETERS.reliability.cache_hit_rate_widget);
  
  // Database e storage
  const dbCost = INFRASTRUCTURE_COSTS.database.avg_storage_per_user_gb * 
    INFRASTRUCTURE_COSTS.database.storage_per_gb_month;
  const storageCost = (volumes.trades_per_month * 
    PRICING_PARAMETERS.image_processing.avg_image_size_mb * 
    INFRASTRUCTURE_COSTS.storage.storage_per_gb_month) / 1024;
  
  // CDN
  const cdnRequestCost = (INFRASTRUCTURE_COSTS.cdn.avg_requests_per_user_month / 1_000_000) *
    INFRASTRUCTURE_COSTS.cdn.requests_per_1m * 
    (1 - INFRASTRUCTURE_COSTS.cdn.cache_hit_rate);
  const cdnTrafficCost = INFRASTRUCTURE_COSTS.cdn.avg_traffic_per_user_gb * 
    INFRASTRUCTURE_COSTS.cdn.traffic_per_gb;
  
  const variableCosts = tradeCosts + analysisCosts + chatCosts + reportCosts + 
    widgetCosts + dbCost + storageCost + cdnRequestCost + cdnTrafficCost;
  
  return {
    fixed: fixedCosts,
    variable: variableCosts,
    total: fixedCosts + variableCosts,
    breakdown: {
      fixed: fixedCosts,
      trades: tradeCosts,
      analysis: analysisCosts,
      chat: chatCosts,
      reports: reportCosts,
      widgets: widgetCosts,
      database: dbCost,
      storage: storageCost,
      cdn: cdnRequestCost + cdnTrafficCost,
    },
  };
}

/**
 * Calcula taxas de pagamento
 */
export function calculatePaymentFees(priceUsd: number): number {
  const stripeFee = (priceUsd * PRICING_PARAMETERS.payment_fees.stripe_percent) + 
    PRICING_PARAMETERS.payment_fees.stripe_fixed_usd;
  const fxFee = priceUsd * PRICING_PARAMETERS.payment_fees.fx_markup;
  const chargebackFee = PRICING_PARAMETERS.payment_fees.avg_chargeback_cost * 
    PRICING_PARAMETERS.payment_fees.chargeback_rate;
  
  return stripeFee + fxFee + chargebackFee;
}

/**
 * Calcula margem bruta por plano
 */
export function calculateGrossMargin(
  tier: keyof typeof PLAN_VOLUMES,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): {
  revenue: number;
  costs: number;
  paymentFees: number;
  grossProfit: number;
  grossMarginPercent: number;
  targetMarginPercent: number;
  meetsTarget: boolean;
} {
  const plan = PLANS[tier];
  const revenue = billingCycle === 'yearly' ? plan.price_yearly_usd / 12 : plan.price_monthly_usd;
  const costs = calculateMonthlyCostPerUser(tier);
  const paymentFees = calculatePaymentFees(revenue);
  
  const grossProfit = revenue - costs.total - paymentFees;
  const grossMarginPercent = (grossProfit / revenue) * 100;
  const meetsTarget = grossMarginPercent >= plan.target_margin_percent;
  
  return {
    revenue,
    costs: costs.total,
    paymentFees,
    grossProfit,
    grossMarginPercent,
    targetMarginPercent: plan.target_margin_percent,
    meetsTarget,
  };
}

// ============================================
// BUNDLES E ADD-ONS
// ============================================

export const BUNDLES = {
  extra_trades: {
    sizes: [100, 500, 1000, 5000],
    base_cost_per_trade: calculateCostPerTrade(),
    markup_percent: 150,               // 150% markup sobre custo
    volume_discounts: {
      100: 0,                          // Sem desconto
      500: 10,                         // 10% de desconto
      1000: 20,                        // 20% de desconto
      5000: 30,                        // 30% de desconto
    },
  },
  extra_exchanges: {
    cost_per_exchange_monthly: 5.00,   // Custo operacional adicional
    price_per_exchange_monthly: 15.00, // Preço para cliente
    margin_percent: 67,                // 67% de margem
  },
  team_seats: {
    cost_per_seat_monthly: 2.00,       // Custo incremental por seat
    price_per_seat_monthly: 20.00,     // Preço para cliente
    margin_percent: 90,                // 90% de margem
  },
} as const;

/**
 * Calcula preço de bundle de trades extras
 */
export function calculateBundlePrice(tradeCount: number): {
  cost: number;
  price: number;
  pricePerTrade: number;
  marginPercent: number;
} {
  const baseCost = BUNDLES.extra_trades.base_cost_per_trade * tradeCount;
  const discount = BUNDLES.extra_trades.volume_discounts[
    tradeCount as keyof typeof BUNDLES.extra_trades.volume_discounts
  ] || 0;
  
  const basePrice = baseCost * (BUNDLES.extra_trades.markup_percent / 100);
  const price = basePrice * (1 - discount / 100);
  
  return {
    cost: baseCost,
    price: Math.round(price * 100) / 100,
    pricePerTrade: Math.round((price / tradeCount) * 1000) / 1000,
    marginPercent: ((price - baseCost) / price) * 100,
  };
}

// ============================================
// RELATÓRIO DE PRECIFICAÇÃO
// ============================================

export function generatePricingReport(): string {
  let report = '=== RELATÓRIO DE PRECIFICAÇÃO ===\n\n';
  
  report += '1. CUSTOS UNITÁRIOS\n';
  report += `   • Custo por trade (lite): $${calculateCostPerTrade(false).toFixed(4)}\n`;
  report += `   • Custo por trade (deep): $${calculateCostPerTrade(true).toFixed(4)}\n`;
  report += `   • Custo por análise: $${calculateAICost('trade_analysis').toFixed(4)}\n`;
  report += `   • Custo por relatório: $${calculateAICost('weekly_report').toFixed(4)}\n`;
  report += `   • Custo por mensagem chat: $${calculateAICost('chat_message').toFixed(4)}\n`;
  report += `   • Custo por imagem: $${calculateImageCost().toFixed(4)}\n\n`;
  
  report += '2. MARGEM POR PLANO\n';
  (['free', 'basic', 'pro', 'elite'] as const).forEach(tier => {
    const monthly = calculateGrossMargin(tier, 'monthly');
    const yearly = calculateGrossMargin(tier, 'yearly');
    
    report += `\n   ${PLANS[tier].name.toUpperCase()}\n`;
    report += `   Monthly: Revenue $${monthly.revenue.toFixed(2)} | `;
    report += `Costs $${monthly.costs.toFixed(2)} | `;
    report += `Margin ${monthly.grossMarginPercent.toFixed(1)}% `;
    report += `${monthly.meetsTarget ? '✓' : '✗ Target: ' + monthly.targetMarginPercent + '%'}\n`;
    
    if (yearly.revenue > 0) {
      report += `   Yearly:  Revenue $${yearly.revenue.toFixed(2)} | `;
      report += `Costs $${yearly.costs.toFixed(2)} | `;
      report += `Margin ${yearly.grossMarginPercent.toFixed(1)}% `;
      report += `${yearly.meetsTarget ? '✓' : '✗'}\n`;
    }
  });
  
  report += '\n3. BREAKDOWN DE CUSTOS POR USUÁRIO\n';
  (['basic', 'pro', 'elite'] as const).forEach(tier => {
    const costs = calculateMonthlyCostPerUser(tier);
    report += `\n   ${PLANS[tier].name}\n`;
    Object.entries(costs.breakdown).forEach(([key, value]) => {
      report += `   • ${key}: $${value.toFixed(4)}\n`;
    });
    report += `   TOTAL: $${costs.total.toFixed(2)}\n`;
  });
  
  report += '\n4. BUNDLES\n';
  [100, 500, 1000, 5000].forEach(size => {
    const bundle = calculateBundlePrice(size);
    report += `   • ${size} trades: $${bundle.price} ($${bundle.pricePerTrade}/trade, `;
    report += `margin ${bundle.marginPercent.toFixed(1)}%)\n`;
  });
  
  report += '\n5. CUSTOS FIXOS GLOBAIS\n';
  report += `   • Total mensal: $${FIXED_COSTS_GLOBAL.total_monthly.toFixed(2)}\n`;
  report += `   • Usuários para cobrir fixos (Pro): ${Math.ceil(
    FIXED_COSTS_GLOBAL.total_monthly / calculateGrossMargin('pro').grossProfit
  )}\n`;
  
  return report;
}
