import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { SEO } from "@/components/SEO";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { Badge } from "@/components/ui/badge";
import { SymbolLabel } from "@/components/common/SymbolLabel";
import { supabase } from "@/integrations/supabase/client";
import { useSubAccount } from "@/contexts/SubAccountContext";
import { formatCurrencyFull, formatNumber } from "@/utils/formatNumber";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/trade";

// Date precedence per project convention: closed_at > trade_date > opened_at > created_at
const getTradeDate = (t: Trade): string | null =>
  t.closed_at ?? t.trade_date ?? t.opened_at ?? t.created_at ?? null;

const getTradePnl = (t: Trade): number => t.profit_loss ?? t.pnl ?? 0;

export default function Trades() {
  const { activeSubAccount } = useSubAccount();

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades-page", activeSubAccount?.id ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("trades")
        .select("*")
        .is("deleted_at", null)
        .order("closed_at", { ascending: false, nullsFirst: false });

      if (activeSubAccount) {
        query = query.eq("sub_account_id", activeSubAccount.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Trade[];
    },
  });

  const sorted = useMemo(
    () =>
      [...trades].sort((a, b) => {
        const da = getTradeDate(a) ?? "";
        const db = getTradeDate(b) ?? "";
        return db.localeCompare(da);
      }),
    [trades]
  );

  const equityData = useMemo(() => {
    let cumulative = 0;
    return [...sorted].reverse().map((t) => {
      cumulative += getTradePnl(t);
      const d = getTradeDate(t);
      return {
        date: d ? format(new Date(d), "dd MMM") : "—",
        equity: Number(cumulative.toFixed(2)),
      };
    });
  }, [sorted]);

  const totalPnl = equityData.length ? equityData[equityData.length - 1].equity : 0;
  const isPositive = totalPnl >= 0;

  return (
    <>
      <SEO
        title="Trades | The Trading Diary"
        description="Complete trade log with equity curve, stop, leverage and result per trade."
        canonical="/trades"
        noindex={true}
      />
      <AppLayout>
        <div className="container mx-auto max-w-7xl p-3 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-fluid-2xl font-bold text-gradient-electric">Trades</h1>
            <Badge variant="secondary" className="font-num text-fluid-xs">
              {sorted.length} trades
            </Badge>
          </div>

          <PremiumCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-fluid-lg font-semibold">Equity curve</h2>
              <span
                className={cn(
                  "font-num text-fluid-lg font-bold flex items-center gap-1.5",
                  isPositive ? "text-apple-green" : "text-apple-red"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {formatCurrencyFull(totalPnl)}
              </span>
            </div>
            {equityData.length === 0 ? (
              <p className="text-fluid-sm text-muted-foreground py-12 text-center">
                No trades yet — import your first trades to see the equity curve.
              </p>
            ) : (
              <div className="w-full chart-fluid-md">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={isPositive ? "hsl(var(--apple-green))" : "hsl(var(--apple-red))"}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor={isPositive ? "hsl(var(--apple-green))" : "hsl(var(--apple-red))"}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={32}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `$${formatNumber(v)}`}
                      width={64}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrencyFull(value), "Equity"]}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke={isPositive ? "hsl(var(--apple-green))" : "hsl(var(--apple-red))"}
                      strokeWidth={2}
                      fill="url(#equityFill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </PremiumCard>

          <PremiumCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-fluid-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 sm:px-4 py-3 font-medium">Date</th>
                    <th className="px-3 sm:px-4 py-3 font-medium">Asset</th>
                    <th className="px-3 sm:px-4 py-3 font-medium">Side</th>
                    <th className="px-3 sm:px-4 py-3 font-medium text-right">Stop</th>
                    <th className="px-3 sm:px-4 py-3 font-medium text-right">Leverage</th>
                    <th className="px-3 sm:px-4 py-3 font-medium text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        Loading trades…
                      </td>
                    </tr>
                  ) : sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        No trades found.
                      </td>
                    </tr>
                  ) : (
                    sorted.map((t) => {
                      const pnl = getTradePnl(t);
                      const d = getTradeDate(t);
                      const win = pnl > 0;
                      return (
                        <tr
                          key={t.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-3 sm:px-4 py-2.5 font-num whitespace-nowrap text-muted-foreground">
                            {d ? format(new Date(d), "dd MMM yy · HH:mm") : "—"}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 font-medium">
                            <SymbolLabel symbol={t.symbol} />
                          </td>
                          <td className="px-3 sm:px-4 py-2.5">
                            {t.side ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-fluid-xs capitalize",
                                  t.side === "long"
                                    ? "border-apple-green/40 text-apple-green"
                                    : "border-apple-red/40 text-apple-red"
                                )}
                              >
                                {t.side}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 text-right font-num">
                            {t.stop_loss != null ? (
                              formatNumber(t.stop_loss)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5 text-right font-num">
                            {t.leverage != null ? (
                              `${t.leverage}x`
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td
                            className={cn(
                              "px-3 sm:px-4 py-2.5 text-right font-num font-semibold",
                              win ? "text-apple-green" : pnl < 0 ? "text-apple-red" : "text-muted-foreground"
                            )}
                          >
                            {pnl === 0 ? "—" : `${win ? "+" : ""}${formatCurrencyFull(pnl)}`}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </PremiumCard>
        </div>
      </AppLayout>
    </>
  );
}
