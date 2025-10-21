import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Trade } from "@/types/trade";
import { FileText, Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/utils/numberFormatting";

const TaxReports = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const { toast } = useToast();

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades-tax", selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .is("deleted_at", null)
        .gte("closed_at", `${selectedYear}-01-01`)
        .lte("closed_at", `${selectedYear}-12-31`)
        .order("closed_at", { ascending: false });

      if (error) throw error;
      return data as Trade[];
    },
  });

  const taxSummary = useMemo(() => {
    const shortTerm: Trade[] = [];
    const longTerm: Trade[] = [];
    let totalGains = 0;
    let totalLosses = 0;

    trades.forEach((trade) => {
      if (!trade.closed_at || !trade.opened_at || !trade.profit_loss) return;

      const openDate = new Date(trade.opened_at);
      const closeDate = new Date(trade.closed_at);
      const daysHeld = Math.floor((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));

      const pnl = trade.profit_loss;
      
      if (daysHeld <= 365) {
        shortTerm.push(trade);
      } else {
        longTerm.push(trade);
      }

      if (pnl > 0) {
        totalGains += pnl;
      } else {
        totalLosses += Math.abs(pnl);
      }
    });

    const shortTermGains = shortTerm.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const longTermGains = longTerm.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

    return {
      shortTerm,
      longTerm,
      shortTermGains,
      longTermGains,
      totalGains,
      totalLosses,
      netPnL: totalGains - totalLosses,
      totalTrades: trades.length,
      totalFees: trades.reduce((sum, t) => sum + (t.trading_fee || 0) + (t.funding_fee || 0), 0),
    };
  }, [trades]);

  const exportToCSV = () => {
    const headers = [
      "Date Opened",
      "Date Closed",
      "Symbol",
      "Side",
      "Entry Price",
      "Exit Price",
      "Position Size",
      "P&L",
      "Fees",
      "Net P&L",
      "Days Held",
      "Tax Category"
    ];

    const rows = trades.map(trade => {
      const openDate = trade.opened_at ? new Date(trade.opened_at) : null;
      const closeDate = trade.closed_at ? new Date(trade.closed_at) : null;
      const daysHeld = openDate && closeDate 
        ? Math.floor((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const taxCategory = daysHeld <= 365 ? "Short-term" : "Long-term";
      const fees = (trade.trading_fee || 0) + (trade.funding_fee || 0);
      const netPnL = (trade.profit_loss || 0) - fees;

      return [
        openDate ? format(openDate, "yyyy-MM-dd") : "",
        closeDate ? format(closeDate, "yyyy-MM-dd") : "",
        trade.symbol,
        trade.side || "",
        trade.entry_price || "",
        trade.exit_price || "",
        trade.position_size || "",
        trade.profit_loss || 0,
        fees,
        netPnL,
        daysHeld,
        taxCategory
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-report-${selectedYear}.csv`;
    a.click();

    toast({
      title: "Tax Report Exported",
      description: `Tax report for ${selectedYear} has been downloaded.`,
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tax Reports</h1>
            <p className="text-muted-foreground mt-2">
              Generate tax reports for your trading activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} className="gap-2" disabled={trades.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net P&L</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${taxSummary.netPnL >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                ${formatNumber(taxSummary.netPnL)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                After fees and losses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gains</CardTitle>
              <TrendingUp className="h-4 w-4 text-neon-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-green">
                ${formatNumber(taxSummary.totalGains)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gross profit from wins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Losses</CardTitle>
              <TrendingDown className="h-4 w-4 text-neon-red" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neon-red">
                ${formatNumber(taxSummary.totalLosses)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total losses deductible
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatNumber(taxSummary.totalFees)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Deductible expenses
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="short-term">Short-term ({taxSummary.shortTerm.length})</TabsTrigger>
            <TabsTrigger value="long-term">Long-term ({taxSummary.longTerm.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tax Summary for {selectedYear}</CardTitle>
                <CardDescription>
                  Overview of your trading activity for tax purposes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Total Trades</span>
                      <span className="font-medium">{taxSummary.totalTrades}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Short-term Gains</span>
                      <span className={`font-medium ${taxSummary.shortTermGains >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                        ${formatNumber(taxSummary.shortTermGains)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Long-term Gains</span>
                      <span className={`font-medium ${taxSummary.longTermGains >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                        ${formatNumber(taxSummary.longTermGains)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Total Fees Paid</span>
                      <span className="font-medium">${formatNumber(taxSummary.totalFees)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Total Gains</span>
                      <span className="font-medium text-neon-green">${formatNumber(taxSummary.totalGains)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Total Losses</span>
                      <span className="font-medium text-neon-red">${formatNumber(taxSummary.totalLosses)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <strong>Disclaimer:</strong> This report is for informational purposes only and should not be considered tax advice. 
                    Please consult with a qualified tax professional or accountant for accurate tax filing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="short-term">
            <Card>
              <CardHeader>
                <CardTitle>Short-term Trades</CardTitle>
                <CardDescription>
                  Positions held for 365 days or less (taxed as ordinary income)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Closed</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead className="text-right">Days Held</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxSummary.shortTerm.map((trade) => {
                      const daysHeld = trade.opened_at && trade.closed_at
                        ? Math.floor((new Date(trade.closed_at).getTime() - new Date(trade.opened_at).getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      return (
                        <TableRow key={trade.id}>
                          <TableCell>{trade.closed_at ? format(new Date(trade.closed_at), "MMM dd, yyyy") : "-"}</TableCell>
                          <TableCell className="font-medium">{trade.symbol}</TableCell>
                          <TableCell>
                            <Badge variant={trade.side === "long" ? "default" : "secondary"}>
                              {trade.side}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${(trade.profit_loss || 0) >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                            ${formatNumber(trade.profit_loss || 0)}
                          </TableCell>
                          <TableCell className="text-right">{daysHeld}d</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="long-term">
            <Card>
              <CardHeader>
                <CardTitle>Long-term Trades</CardTitle>
                <CardDescription>
                  Positions held for more than 365 days (preferential tax treatment)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Closed</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead className="text-right">Days Held</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxSummary.longTerm.map((trade) => {
                      const daysHeld = trade.opened_at && trade.closed_at
                        ? Math.floor((new Date(trade.closed_at).getTime() - new Date(trade.opened_at).getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      return (
                        <TableRow key={trade.id}>
                          <TableCell>{trade.closed_at ? format(new Date(trade.closed_at), "MMM dd, yyyy") : "-"}</TableCell>
                          <TableCell className="font-medium">{trade.symbol}</TableCell>
                          <TableCell>
                            <Badge variant={trade.side === "long" ? "default" : "secondary"}>
                              {trade.side}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${(trade.profit_loss || 0) >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                            ${formatNumber(trade.profit_loss || 0)}
                          </TableCell>
                          <TableCell className="text-right">{daysHeld}d</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TaxReports;
