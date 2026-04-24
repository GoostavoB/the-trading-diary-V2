import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Download, Mail, Trash, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { layout, spacing, typography } from '@/styles/design-tokens';
import { SkipToContent } from '@/components/SkipToContent';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';

export default function Reports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState<'performance' | 'analysis' | 'coaching'>('performance');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['generated-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_reports' as any)
        .select('*')
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  }) as any;

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Fetch trades in date range
      const { data: trades } = await supabase
        .from('trades')
        .select('id')
        .gte('closed_at', dateRange.from.toISOString())
        .lte('closed_at', dateRange.to.toISOString())
        .is('deleted_at', null);

      if (!trades || trades.length === 0) {
        throw new Error('No trades found in selected date range');
      }

      // Generate report using AI
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            trade_ids: trades.map(t => t.id),
            period: `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}`,
            report_type: reportType
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate report');
      const result = await response.json();

      // Save to database
      const { error } = await (supabase.from('generated_reports' as any).insert({
        report_type: reportType,
        period_start: format(dateRange.from, 'yyyy-MM-dd'),
        period_end: format(dateRange.to, 'yyyy-MM-dd'),
        report_data: result.report,
        trade_count: trades.length
      }) as any);

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Report generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await (supabase
        .from('generated_reports' as any)
        .delete()
        .eq('id', reportId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Report deleted');
      queryClient.invalidateQueries({ queryKey: ['generated-reports'] });
    },
  });

  const downloadReport = (report: any) => {
    const content = `
${report.report_type.toUpperCase()} REPORT
Period: ${format(new Date(report.period_start), 'MMM dd, yyyy')} - ${format(new Date(report.period_end), 'MMM dd, yyyy')}
Generated: ${format(new Date(report.generated_at), 'MMM dd, yyyy HH:mm')}
Trades Analyzed: ${report.trade_count}

${JSON.stringify(report.report_data, null, 2)}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_type}-report-${format(new Date(report.period_start), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEO
        title={pageMeta.reports.title}
        description={pageMeta.reports.description}
        keywords={pageMeta.reports.keywords}
        canonical={pageMeta.reports.canonical}
        noindex={true}
      />
      <AppLayout>
      <SkipToContent />
      <main id="main-content" className={layout.container}>
        <div className={spacing.section}>
          <header>
            <h1 className={typography.pageTitle} id="reports-heading">Trading Reports</h1>
            <p className={typography.pageSubtitle}>
              Generate AI-powered reports on your trading performance
            </p>
          </header>

          {/* Generation Section */}
          <PremiumCard>
            <div className="p-6 pb-2">
              <h3 className={typography.cardTitle}>Generate New Report</h3>
              <p className={typography.cardDescription}>
                Select a date range and report type to analyze your trading performance
              </p>
            </div>
            <div className={`${spacing.card} p-6 pt-0`}>
              <div className={layout.grid.twoCol}>
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance Analysis</SelectItem>
                      <SelectItem value="analysis">Technical Analysis</SelectItem>
                      <SelectItem value="coaching">Coaching Insights</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <DateRangePicker
                    startDate={dateRange.from}
                    endDate={dateRange.to}
                    onDateChange={(start, end) => start && end && setDateRange({ from: start, to: end })}
                  />
                </div>
              </div>

              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full mt-4"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </PremiumCard>

          {/* History Section */}
          <PremiumCard>
            <div className="p-6 pb-2">
              <h3 className="text-lg font-semibold">Report History</h3>
              <p className="text-sm text-muted-foreground">
                View and download your previously generated reports
              </p>
            </div>
            <div className="p-6 pt-0">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reports generated yet. Create your first report above.
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold capitalize">{report.report_type} Report</h4>
                          <Badge variant="secondary">{report.trade_count} trades</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(report.period_start), 'MMM dd, yyyy')} - {format(new Date(report.period_end), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Generated {format(new Date(report.generated_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => downloadReport(report)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteMutation.mutate(report.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PremiumCard>
        </div>
      </main>
    </AppLayout>
    </>
  );
}
