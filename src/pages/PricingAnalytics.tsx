import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  PLANS,
  PLAN_VOLUMES,
  calculateGrossMargin,
  calculateMonthlyCostPerUser,
  calculateCostPerTrade,
  calculateAICost,
  calculateBundlePrice,
  generatePricingReport,
  FIXED_COSTS_GLOBAL,
  INFRASTRUCTURE_COSTS,
  PRICING_PARAMETERS,
} from '@/config/pricingCalculator';

export const PricingAnalytics = () => {
  const downloadReport = () => {
    const report = generatePricingReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pricing-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Pricing Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Análise completa de custos e margens por plano
            </p>
          </div>
          <Button onClick={downloadReport} size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>

        {/* Custos Unitários */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Custos Unitários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="text-sm text-muted-foreground">Trade Upload (Lite)</div>
              <div className="text-2xl font-bold">${calculateCostPerTrade(false).toFixed(4)}</div>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="text-sm text-muted-foreground">Trade Upload (Deep)</div>
              <div className="text-2xl font-bold">${calculateCostPerTrade(true).toFixed(4)}</div>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="text-sm text-muted-foreground">AI Analysis</div>
              <div className="text-2xl font-bold">${calculateAICost('trade_analysis').toFixed(4)}</div>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="text-sm text-muted-foreground">Weekly Report</div>
              <div className="text-2xl font-bold">${calculateAICost('weekly_report').toFixed(4)}</div>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="text-sm text-muted-foreground">Chat Message</div>
              <div className="text-2xl font-bold">${calculateAICost('chat_message').toFixed(4)}</div>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="text-sm text-muted-foreground">Widget Generation</div>
              <div className="text-2xl font-bold">${calculateAICost('generate_widget').toFixed(4)}</div>
            </div>
          </div>
        </Card>

        {/* Margens por Plano */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Margem por Plano
          </h2>
          <div className="space-y-6">
            {(['basic', 'pro', 'elite'] as const).map((tier) => {
              const monthly = calculateGrossMargin(tier, 'monthly');
              const yearly = calculateGrossMargin(tier, 'yearly');
              const costs = calculateMonthlyCostPerUser(tier);

              return (
                <div key={tier} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{PLANS[tier].name}</h3>
                    {monthly.meetsTarget ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Atinge margem alvo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="h-5 w-5" />
                        <span>Abaixo da margem alvo</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monthly */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Monthly</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Revenue:</span>
                          <span className="font-semibold">${monthly.revenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Costs:</span>
                          <span className="font-semibold text-red-600">
                            -${monthly.costs.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Payment Fees:</span>
                          <span className="font-semibold text-red-600">
                            -${monthly.paymentFees.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span>Gross Profit:</span>
                          <span className="font-bold text-green-600">
                            ${monthly.grossProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Margin:</span>
                          <span className={`font-bold ${monthly.meetsTarget ? 'text-green-600' : 'text-yellow-600'}`}>
                            {monthly.grossMarginPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Target:</span>
                          <span>{monthly.targetMarginPercent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Yearly */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Yearly (per month)</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Revenue:</span>
                          <span className="font-semibold">${yearly.revenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Costs:</span>
                          <span className="font-semibold text-red-600">
                            -${yearly.costs.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Payment Fees:</span>
                          <span className="font-semibold text-red-600">
                            -${yearly.paymentFees.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span>Gross Profit:</span>
                          <span className="font-bold text-green-600">
                            ${yearly.grossProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Margin:</span>
                          <span className={`font-bold ${yearly.meetsTarget ? 'text-green-600' : 'text-yellow-600'}`}>
                            {yearly.grossMarginPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                      Ver breakdown de custos
                    </summary>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {Object.entries(costs.breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-2 bg-accent/5 rounded">
                          <span className="capitalize">{key}:</span>
                          <span className="font-semibold">${(value as number).toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </details>

                  {/* Volume Info */}
                  <div className="mt-4 text-xs text-muted-foreground">
                    {PLAN_VOLUMES[tier].ai_uploads_per_month} uploads/mês • {' '}
                    {PLAN_VOLUMES[tier].analyses_per_week} análises/semana • {' '}
                    {PLAN_VOLUMES[tier].chat_messages_per_month} msgs/mês • {' '}
                    {PLAN_VOLUMES[tier].weekly_reports} reports/mês
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Bundles */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Bundles & Add-ons</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Extra Trades</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[100, 500, 1000, 5000].map((size) => {
                  const bundle = calculateBundlePrice(size);
                  return (
                    <div key={size} className="p-4 bg-accent/10 rounded-lg">
                      <div className="text-lg font-bold">{size} trades</div>
                      <div className="text-2xl font-bold text-primary">${bundle.price}</div>
                      <div className="text-xs text-muted-foreground">
                        ${bundle.pricePerTrade.toFixed(3)}/trade
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Margin: {bundle.marginPercent.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-accent/10 rounded-lg">
                <div className="text-sm text-muted-foreground">Extra Exchange</div>
                <div className="text-2xl font-bold">$15<span className="text-sm">/mo</span></div>
                <div className="text-xs text-green-600">Margin: 67%</div>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg">
                <div className="text-sm text-muted-foreground">Team Seat</div>
                <div className="text-2xl font-bold">$20<span className="text-sm">/mo</span></div>
                <div className="text-xs text-green-600">Margin: 90%</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Infraestrutura */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Custos de Infraestrutura</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Database & Storage</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>DB Storage (per GB/mo):</span>
                  <span>${INFRASTRUCTURE_COSTS.database.storage_per_gb_month}</span>
                </div>
                <div className="flex justify-between">
                  <span>Object Storage (per GB/mo):</span>
                  <span>${INFRASTRUCTURE_COSTS.storage.storage_per_gb_month}</span>
                </div>
                <div className="flex justify-between">
                  <span>CDN Traffic (per GB):</span>
                  <span>${INFRASTRUCTURE_COSTS.cdn.traffic_per_gb}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">AI Models</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Gemini Flash (input/1K):</span>
                  <span>${PRICING_PARAMETERS.ai_costs.gemini_flash.input_per_1k_tokens}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gemini Flash (output/1K):</span>
                  <span>${PRICING_PARAMETERS.ai_costs.gemini_flash.output_per_1k_tokens}</span>
                </div>
                <div className="flex justify-between">
                  <span>OCR Processing (per image):</span>
                  <span>${PRICING_PARAMETERS.ai_costs.ocr_processing}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Custos Fixos */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Custos Fixos Globais</h2>
          <div className="space-y-2">
            {Object.entries(FIXED_COSTS_GLOBAL.monthly).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-semibold">${value.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-base font-bold pt-2 border-t">
              <span>Total Mensal:</span>
              <span>${FIXED_COSTS_GLOBAL.total_monthly.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-500/10 rounded-lg">
            <div className="text-sm font-medium mb-2">Break-even (custos fixos)</div>
            <div className="text-xs text-muted-foreground">
              Para cobrir custos fixos globais com margem Pro:
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {Math.ceil(
                FIXED_COSTS_GLOBAL.total_monthly / calculateGrossMargin('pro').grossProfit
              )}{' '}
              usuários Pro
            </div>
          </div>
        </Card>

        {/* Observações */}
        <Card className="p-6 bg-yellow-500/5 border-yellow-500/20">
          <h2 className="text-2xl font-semibold mb-4">⚠️ Observações Importantes</h2>
          <ul className="space-y-2 text-sm">
            <li>• Custos de AI baseados em médias. P95 pode ser até 2x maior.</li>
            <li>• Taxa de retry de 8% em uploads e 5% em análises já incluída.</li>
            <li>• Cache hit rate de 65% em widgets customizados.</li>
            <li>• Armazenamento com redundância 1.5x (geo-replication).</li>
            <li>• Taxas de pagamento Stripe: 2.9% + $0.30 + 1% FX.</li>
            <li>• Custos fixos globais precisam ser cobertos por base de usuários.</li>
            <li>• Plano Free é custo de aquisição, sem expectativa de margem.</li>
            <li>• Considerar picos sazonais e promoções na análise de margem.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
