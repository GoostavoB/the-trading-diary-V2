import { useState } from 'react';
import { useDynamicRiskEngine, type DRETier } from '@/hooks/useDynamicRiskEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, Check, X, Zap, Target, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MetricTooltip } from '@/components/MetricTooltip';

const TIER_COLORS: Record<DRETier, string> = {
  protection: 'hsl(0, 72%, 51%)',
  aggressive: 'hsl(217, 91%, 60%)',
  moderate: 'hsl(271, 91%, 65%)',
  conservative: 'hsl(45, 93%, 47%)',
  institutional: 'hsl(160, 84%, 39%)',
};

const TIER_BG: Record<DRETier, string> = {
  protection: 'bg-red-500/10 border-red-500/30 text-red-500',
  aggressive: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  moderate: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
  conservative: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  institutional: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
};

export function DREContent() {
  const dre = useDynamicRiskEngine();
  const { formatAmount } = useCurrency();
  const [simValue, setSimValue] = useState('');
  const [simResult, setSimResult] = useState<ReturnType<typeof dre.simulate> | null>(null);
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(String(dre.initialBalance));

  const handleSimulate = () => {
    const val = parseFloat(simValue);
    if (!isNaN(val)) {
      setSimResult(dre.simulate(val));
    }
  };

  const handleBalanceSave = () => {
    const val = parseFloat(balanceInput);
    if (!isNaN(val) && val > 0) {
      dre.setManualBalance(val);
      setEditingBalance(false);
    }
  };

  // Gauge data
  const gaugeValue = Math.max(0, Math.min(100, ((dre.surplus + 50) / 600) * 100));
  const gaugeData = [
    { value: gaugeValue },
    { value: 100 - gaugeValue },
  ];

  const tierColor = TIER_COLORS[dre.tier];
  const compliantTrades = dre.todayTrades.filter(t => t.respectedDRE).length;
  const violatedTrades = dre.todayTrades.filter(t => !t.respectedDRE).length;

  return (
    <div className="flex flex-col gap-3 overflow-y-auto" style={{ height: 'calc(100vh - 220px)' }}>
      {/* Top Row: Status Badge + Next Trade Command */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Status Badge */}
        <Card className="glass border-0">
          <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
            <div className={`px-4 py-2 rounded-full border font-bold text-lg ${TIER_BG[dre.tier]}`}>
              {dre.tierLabel}
            </div>
            <p className="text-xs text-muted-foreground text-center">Status Atual do Engine</p>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground text-[10px]">Saldo Inicial</p>
                {editingBalance ? (
                  <div className="flex gap-1 items-center">
                    <Input
                      className="h-6 w-20 text-xs"
                      value={balanceInput}
                      onChange={(e) => setBalanceInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleBalanceSave()}
                    />
                    <Button size="sm" variant="ghost" className="h-6 px-1" onClick={handleBalanceSave}>
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="font-semibold cursor-pointer hover:underline" onClick={() => setEditingBalance(true)}>
                    {formatAmount(dre.initialBalance)}
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-[10px]">Meta Diária</p>
                <p className="font-semibold">{formatAmount(dre.dailyGoal)}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-[10px]">PnL Hoje</p>
                <p className={`font-semibold ${dre.todayPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatAmount(dre.todayPnL)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Trade Command - Maximum Visual Highlight */}
        <Card className="glass border-0 md:col-span-1" style={{ borderLeft: `3px solid ${tierColor}` }}>
          <CardContent className="p-4 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Target className="h-3 w-3" />
              PRÓXIMO TRADE - STOP MÁXIMO
            </div>
            <div className="text-4xl font-black" style={{ color: tierColor }}>
              {formatAmount(dre.allowedRisk)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Excedente: {formatAmount(dre.surplus)}
            </p>
            {dre.tier === 'protection' && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                Meta de {formatAmount(dre.dailyGoal)} protegida. Não opere.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Gauge */}
        <Card className="glass border-0">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-1">Curva de Risco</p>
            <div className="w-full h-[100px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="90%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={tierColor} />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-end justify-center pb-1">
                <span className="text-xs font-bold" style={{ color: tierColor }}>
                  {dre.surplus >= 0 ? '+' : ''}{formatAmount(dre.surplus)}
                </span>
              </div>
            </div>
            {/* Tier scale */}
            <div className="flex gap-1 mt-1 w-full">
              {(['protection', 'aggressive', 'moderate', 'conservative', 'institutional'] as DRETier[]).map((t) => (
                <div
                  key={t}
                  className={`h-1.5 flex-1 rounded-full transition-all ${dre.tier === t ? 'opacity-100 scale-y-150' : 'opacity-30'}`}
                  style={{ backgroundColor: TIER_COLORS[t] }}
                />
              ))}
            </div>
            <div className="flex justify-between w-full text-[8px] text-muted-foreground mt-0.5">
              <span>$0</span>
              <span>$10</span>
              <span>$50</span>
              <span>$150</span>
              <span>$500+</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Simulator + Health Check */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
        {/* Trade Simulator */}
        <Card className="glass border-0">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              Simular Próximo Trade
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Lucro / Prejuízo Hipotético ($)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 50 ou -30"
                  value={simValue}
                  onChange={(e) => setSimValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSimulate} className="self-end">
                Simular
              </Button>
            </div>

            {simResult && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Novo PnL do dia</span>
                  <span className={simResult.newPnL >= 0 ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>
                    {formatAmount(simResult.newPnL)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Novo Excedente</span>
                  <span className="font-semibold">{formatAmount(simResult.newSurplus)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Novo Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${TIER_BG[simResult.newTier]}`}>
                    {simResult.newTierLabel}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Novo Stop Permitido</span>
                  <span className="font-bold text-base" style={{ color: TIER_COLORS[simResult.newTier] }}>
                    {formatAmount(simResult.newAllowedRisk)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Check History */}
        <Card className="glass border-0 flex flex-col">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-blue-500" />
                Health Check - Trades de Hoje
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                <span className="text-emerald-500">{compliantTrades}✓</span>
                {violatedTrades > 0 && <span className="text-red-500 ml-1">{violatedTrades}✗</span>}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 flex-1 overflow-y-auto min-h-0">
            {dre.todayTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                <Shield className="h-8 w-8 opacity-30" />
                <p>Nenhum trade registrado hoje</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {dre.todayTrades.map((trade, i) => (
                  <div key={trade.id} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-muted/30">
                    <span className="text-muted-foreground text-xs w-4">#{i + 1}</span>
                    {trade.respectedDRE ? (
                      <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-emerald-500" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <X className="h-3 w-3 text-red-500" />
                      </div>
                    )}
                    <span className="font-medium flex-1 truncate">{trade.symbol}</span>
                    <span className={`font-semibold ${trade.profit_loss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {trade.profit_loss >= 0 ? '+' : ''}{formatAmount(trade.profit_loss)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      max: {formatAmount(trade.allowedRiskAtTime)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
