import { PremiumCard } from "@/components/ui/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingDown, AlertTriangle, Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DrawdownChartProps {
  data: Array<{
    date: string;
    equity: number;
    peak: number;
    drawdown: number;
  }>;
  maxDrawdown: number;
  currentDrawdown: number;
}

export function DrawdownChart({ data, maxDrawdown, currentDrawdown }: DrawdownChartProps) {
  const isInDrawdown = currentDrawdown < -1;
  const isSignificantDrawdown = currentDrawdown < -10;

  return (
    <PremiumCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Drawdown Analysis</h2>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Track how far your equity has fallen from its peak. Lower drawdowns indicate better risk management.</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        {isSignificantDrawdown && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            High Drawdown
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PremiumCard className="p-4 bg-accent/50">
          <div className="text-sm text-muted-foreground mb-1">Current Drawdown</div>
          <div className={`text-2xl font-bold ${currentDrawdown < -10 ? 'text-destructive' : currentDrawdown < -5 ? 'text-warning' : 'text-success'}`}>
            {currentDrawdown.toFixed(2)}%
          </div>
        </PremiumCard>
        <PremiumCard className="p-4 bg-accent/50">
          <div className="text-sm text-muted-foreground mb-1">Maximum Drawdown</div>
          <div className="text-2xl font-bold text-destructive">
            {maxDrawdown.toFixed(2)}%
          </div>
        </PremiumCard>
        <PremiumCard className="p-4 bg-accent/50">
          <div className="text-sm text-muted-foreground mb-1">Recovery Needed</div>
          <div className="text-2xl font-bold text-primary">
            {currentDrawdown < 0 ? Math.abs((100 / (100 + currentDrawdown) - 1) * 100).toFixed(2) : '0.00'}%
          </div>
        </PremiumCard>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded p-3 shadow-lg">
                    <p className="text-sm font-medium mb-2">{payload[0].payload.date}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Equity:</span>
                        <span className="text-xs font-medium">${payload[0].payload.equity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Peak:</span>
                        <span className="text-xs font-medium">${payload[0].payload.peak.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Drawdown:</span>
                        <span className={`text-xs font-medium ${payload[0].payload.drawdown < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {payload[0].payload.drawdown.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          <ReferenceLine y={-10} stroke="#ef4444" strokeDasharray="3 3" label="Warning Level" />
          <Area
            type="monotone"
            dataKey="drawdown"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 bg-primary/10 rounded border border-primary/20">
        <h4 className="font-semibold text-primary mb-2">Recovery Strategy</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          {isSignificantDrawdown ? (
            <>
              <li>• Consider reducing position sizes by 50%</li>
              <li>• Focus on high-probability setups only</li>
              <li>• Take a break to review your strategy</li>
              <li>• Avoid revenge trading at all costs</li>
            </>
          ) : isInDrawdown ? (
            <>
              <li>• Maintain current position sizing</li>
              <li>• Stick to your trading plan</li>
              <li>• Avoid overtrading to recover</li>
              <li>• Stay disciplined with risk management</li>
            </>
          ) : (
            <>
              <li>• Continue current strategy</li>
              <li>• Maintain discipline and consistency</li>
              <li>• Keep tracking your performance</li>
              <li>• Stay within risk parameters</li>
            </>
          )}
        </ul>
      </div>
    </PremiumCard>
  );
}
