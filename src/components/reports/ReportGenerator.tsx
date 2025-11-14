import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, Mail, Eye } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PDFReportPreview } from "./PDFReportPreview";

type ReportType = "monthly" | "quarterly" | "yearly" | "custom";
type ReportFormat = "excel" | "json";

interface ReportSection {
  id: string;
  label: string;
  enabled: boolean;
}

export function ReportGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [reportFormat, setReportFormat] = useState<ReportFormat>("excel");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const [sections, setSections] = useState<ReportSection[]>([
    { id: "summary", label: "Executive Summary", enabled: true },
    { id: "performance", label: "Performance Metrics", enabled: true },
    { id: "trades", label: "Trade History", enabled: true },
    { id: "analytics", label: "Advanced Analytics", enabled: true },
    { id: "risk", label: "Risk Analysis", enabled: true },
    { id: "goals", label: "Goals Progress", enabled: true },
    { id: "charts", label: "Charts & Visualizations", enabled: true },
    { id: "insights", label: "AI Insights", enabled: false },
  ]);

  const { data: trades } = useQuery({
    queryKey: ['trades-report', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('trade_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const toggleSection = (id: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const generateReport = async () => {
    if (!user) return;

    if (!trades || trades.length === 0) {
      toast({
        title: "No Data",
        description: "You need trades to generate a report",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Determine date range based on report type
      let dateStart = startDate;
      let dateEnd = endDate;

      if (reportType === 'monthly') {
        const now = new Date();
        dateStart = startOfMonth(now);
        dateEnd = endOfMonth(now);
      } else if (reportType === 'quarterly') {
        const now = new Date();
        dateStart = startOfQuarter(now);
        dateEnd = endOfQuarter(now);
      } else if (reportType === 'yearly') {
        const now = new Date();
        dateStart = startOfYear(now);
        dateEnd = endOfYear(now);
      }

      // Filter trades by date range
      const filteredTrades = (trades || []).filter((trade) => {
        const tradeDate = new Date(trade.trade_date);
        const start = dateStart ? new Date(dateStart) : null;
        const end = dateEnd ? new Date(dateEnd) : null;
        
        if (start && tradeDate < start) return false;
        if (end && tradeDate > end) return false;
        return true;
      });

      if (filteredTrades.length === 0) {
        toast({
          title: "No Data",
          description: "No trades found in the selected period",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // Calculate comprehensive metrics
      const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const totalFees = filteredTrades.reduce((sum, t) => sum + (t.trading_fee || 0) + (t.funding_fee || 0), 0);
      const netPnL = totalPnL - totalFees;
      const winningTrades = filteredTrades.filter(t => (t.pnl || 0) > 0);
      const losingTrades = filteredTrades.filter(t => (t.pnl || 0) < 0);
      const winRate = filteredTrades.length > 0 
        ? (winningTrades.length / filteredTrades.length) * 100 
        : 0;
      const avgWin = winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
        : 0;
      const avgLoss = losingTrades.length > 0
        ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length
        : 0;
      const profitFactor = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0;

      // Best and worst trades
      const sortedByPnL = [...filteredTrades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
      const bestTrade = sortedByPnL[0];
      const worstTrade = sortedByPnL[sortedByPnL.length - 1];

      // Top assets
      const assetPnL = new Map<string, { pnl: number; trades: number }>();
      filteredTrades.forEach(t => {
        const current = assetPnL.get(t.symbol) || { pnl: 0, trades: 0 };
        assetPnL.set(t.symbol, {
          pnl: current.pnl + (t.pnl || 0),
          trades: current.trades + 1
        });
      });
      const topAssets = Array.from(assetPnL.entries())
        .sort((a, b) => b[1].pnl - a[1].pnl)
        .slice(0, 5)
        .map(([symbol, data]) => ({ symbol, ...data }));

      // Monthly breakdown
      const monthlyData = new Map<string, { pnl: number; trades: number }>();
      filteredTrades.forEach(t => {
        const month = format(new Date(t.opened_at || t.trade_date), 'MMM yyyy');
        const current = monthlyData.get(month) || { pnl: 0, trades: 0 };
        monthlyData.set(month, {
          pnl: current.pnl + (t.pnl || 0),
          trades: current.trades + 1
        });
      });
      const monthlyBreakdown = Array.from(monthlyData.entries())
        .map(([month, data]) => ({ month, ...data }));

      const reportDataObj = {
        period: dateStart && dateEnd 
          ? `${format(dateStart, 'MMM dd, yyyy')} - ${format(dateEnd, 'MMM dd, yyyy')}`
          : 'All Time',
        totalTrades: filteredTrades.length,
        winRate,
        totalPnL,
        avgWin,
        avgLoss,
        profitFactor,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        totalFees,
        netPnL,
        bestTrade: { symbol: bestTrade?.symbol || 'N/A', pnl: bestTrade?.pnl || 0 },
        worstTrade: { symbol: worstTrade?.symbol || 'N/A', pnl: worstTrade?.pnl || 0 },
        topAssets,
        monthlyBreakdown,
      };

      setReportData(reportDataObj);

      // Save report to database
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          report_name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
          report_type: reportType,
          report_format: reportFormat,
          date_range: { start: dateStart?.toISOString(), end: dateEnd?.toISOString() },
          sections: sections.filter(s => s.enabled).map(s => s.id),
          metrics: {
            totalPnL,
            winRate,
            totalTrades: filteredTrades.length,
            avgWin,
            avgLoss,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
          },
          status: 'completed',
        })
        .select()
        .single();

      if (reportError) throw reportError;

      setShowPreview(true);
      toast({
        title: "Report Generated",
        description: `Your ${reportType} report is ready for download.`,
      });

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Settings</CardTitle>
          <CardDescription>Configure your trading report parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="quarterly">Quarterly Report</SelectItem>
                <SelectItem value="yearly">Yearly Report</SelectItem>
                <SelectItem value="custom">Custom Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Report Format</Label>
            <Select value={reportFormat} onValueChange={(v) => setReportFormat(v as ReportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Sections</CardTitle>
          <CardDescription>Select sections to include in your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="flex items-center space-x-2">
                <Checkbox
                  id={section.id}
                  checked={section.enabled}
                  onCheckedChange={() => toggleSection(section.id)}
                />
                <Label
                  htmlFor={section.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {section.label}
                </Label>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Button 
              className="flex-1" 
              onClick={generateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Report Preview */}
      {showPreview && reportData && (
        <PDFReportPreview 
          data={reportData} 
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}
