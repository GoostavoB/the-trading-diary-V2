import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, AlertCircle, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import type { Trade } from '@/types/trade';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { ExplainMetricButton } from '@/components/ExplainMetricButton';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { useTranslation } from '@/hooks/useTranslation';
import { findBestWorstDays, getTopAssets } from '@/utils/insightCalculations';
import { cn } from '@/lib/utils';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface PerformanceHighlightsProps {
  trades: Trade[];
  bestTrade?: Trade;
  worstTrade?: Trade;
  currentStreak: { type: 'win' | 'loss'; count: number };
}

export const PerformanceHighlights = memo(({ 
  trades, 
  bestTrade, 
  worstTrade,
  currentStreak
}: PerformanceHighlightsProps) => {
  const { openWithPrompt } = useAIAssistant();
  const { t } = useTranslation();

  // Add defensive check
  if (!trades || trades.length === 0 || !bestTrade || !worstTrade) return null;

  const { best: bestDay, worst: worstDay } = findBestWorstDays(trades);
  const topAssets = getTopAssets(trades, 3);
  const bottomAssets = getTopAssets(trades, trades.length).slice(-3).reverse();

  if (!bestTrade || !worstTrade) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Trophy className="w-5 h-5 text-profit" />
        {t('insights.performanceHighlights')}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT COLUMN - Success */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-profit" />
            {t('insights.whatWorking')}
          </h4>
          
          {/* Best Trade */}
          <Card className="p-4 bg-gradient-to-br from-profit/10 to-transparent border-profit/30 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-profit" aria-hidden="true" />
                <h5 className="font-semibold text-sm">{t('insights.bestTrade')}</h5>
              </div>
              <ExplainMetricButton
                metricName={t('insights.bestTrade')}
                metricValue={formatCurrency(bestTrade.pnl || 0)}
                context={`${bestTrade.symbol} with ${formatPercent(bestTrade.roi || 0)} ROI`}
                onExplain={openWithPrompt}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('insights.symbol')}</span>
                <Badge variant="outline" className="text-xs">{bestTrade.symbol || bestTrade.symbol_temp}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('insights.pnl')}</span>
                <span className="text-sm font-bold text-profit">
                  <BlurredCurrency amount={bestTrade.pnl || 0} className="inline" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ROI</span>
                <span className="text-sm font-bold text-profit">
                  +{formatPercent(bestTrade.roi || 0)}
                </span>
              </div>
            </div>
          </Card>

          {/* Best Day */}
          {bestDay && (
            <Card className="p-4 bg-profit/10 border-profit/30 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-profit" />
                  <span className="text-xs font-semibold text-profit">{t('insights.bestDay')}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-profit">
                <BlurredCurrency amount={bestDay.totalPnL} className="inline" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(bestDay.date).toLocaleDateString()} • {bestDay.tradeCount} {t('insights.trades')}
              </p>
            </Card>
          )}

          {/* Top Assets */}
          {topAssets.length > 0 && (
            <Card className="p-4 bg-profit/10 border-profit/30">
              <p className="text-xs font-semibold text-profit mb-3">{t('insights.topAssets')}</p>
              <div className="space-y-2">
                {topAssets.map((asset, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{idx + 1}
                      </Badge>
                      <span className="text-sm font-medium">{asset.symbol}</span>
                    </div>
                    <span className="text-sm text-profit font-bold">
                      <BlurredCurrency amount={asset.avgPnL} className="inline" />
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Current Streak */}
          {currentStreak.count >= 3 && (
            <Card className={cn(
              "p-4",
              currentStreak.type === 'win' 
                ? "bg-profit/10 border-profit/30" 
                : "bg-yellow-500/10 border-yellow-500/30"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {t('insights.currentStreak')}
                  </p>
                  <p className="text-2xl font-bold">
                    {currentStreak.count} {currentStreak.type === 'win' ? t('dashboard.wins') : t('dashboard.losses')}
                  </p>
                </div>
                {currentStreak.type === 'win' ? 
                  <TrendingUp className="h-8 w-8 text-profit" /> :
                  <TrendingDown className="h-8 w-8 text-yellow-500" />
                }
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN - Areas to Improve */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            {t('insights.areasToImprove')}
          </h4>
          
          {/* Worst Trade */}
          <Card className="p-4 bg-gradient-to-br from-loss/10 to-transparent border-loss/30 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-loss" aria-hidden="true" />
                <h5 className="font-semibold text-sm">{t('insights.worstTrade')}</h5>
              </div>
              <ExplainMetricButton
                metricName={t('insights.worstTrade')}
                metricValue={formatCurrency(worstTrade.pnl || 0)}
                context={`${worstTrade.symbol} with ${formatPercent(worstTrade.roi || 0)} ROI`}
                onExplain={openWithPrompt}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('insights.symbol')}</span>
                <Badge variant="outline" className="text-xs">{worstTrade.symbol || worstTrade.symbol_temp}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('insights.pnl')}</span>
                <span className="text-sm font-bold text-loss">
                  <BlurredCurrency amount={worstTrade.pnl || 0} className="inline" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ROI</span>
                <span className="text-sm font-bold text-loss">
                  {formatPercent(worstTrade.roi || 0)}
                </span>
              </div>
            </div>
          </Card>

          {/* Worst Day */}
          {worstDay && (
            <Card className="p-4 bg-loss/10 border-loss/30 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-loss" />
                  <span className="text-xs font-semibold text-loss">{t('insights.worstDay')}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-loss">
                <BlurredCurrency amount={worstDay.totalPnL} className="inline" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(worstDay.date).toLocaleDateString()} • {worstDay.tradeCount} {t('insights.trades')}
              </p>
            </Card>
          )}

          {/* Bottom Assets */}
          {bottomAssets.length > 0 && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
              <p className="text-xs font-semibold text-yellow-500 mb-3">{t('insights.underperforming')}</p>
              <div className="space-y-2">
                {bottomAssets.map((asset, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{idx + 1}
                      </Badge>
                      <span className="text-sm font-medium">{asset.symbol}</span>
                    </div>
                    <span className="text-sm text-loss font-bold">
                      <BlurredCurrency amount={asset.avgPnL} className="inline" />
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
});

PerformanceHighlights.displayName = 'PerformanceHighlights';
