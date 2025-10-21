import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, Mail } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type ReportType = "monthly" | "quarterly" | "yearly" | "custom";
type ReportFormat = "pdf" | "excel" | "json";

interface ReportSection {
  id: string;
  label: string;
  enabled: boolean;
}

export function ReportGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [reportFormat, setReportFormat] = useState<ReportFormat>("pdf");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);

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
      // Filter trades by date range
      const filteredTrades = (trades || []).filter((trade) => {
        const tradeDate = new Date(trade.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && tradeDate < start) return false;
        if (end && tradeDate > end) return false;
        return true;
      });

      // Calculate metrics
      const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
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

      // Save report to database
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          report_name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
          report_type: reportType,
          report_format: reportFormat,
          date_range: { start: startDate?.toISOString(), end: endDate?.toISOString() },
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

      toast({
        title: "Report Generated",
        description: `Your ${reportType} report has been saved successfully.`,
      });

      // In production, you could call an edge function here to generate the actual file
      // await supabase.functions.invoke('generate-report', { body: { reportId: report.id } });
      
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
                <SelectItem value="pdf">PDF Document</SelectItem>
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
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Report"}
            </Button>
            <Button variant="outline" disabled={isGenerating}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
