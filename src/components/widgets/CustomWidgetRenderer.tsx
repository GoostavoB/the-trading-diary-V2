import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Trash2, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatNumber, formatPercent } from '@/utils/formatNumber';

interface CustomWidget {
  id: string;
  title: string;
  description: string;
  widget_type: string;
  query_config: any;
  display_config: any;
}

interface CustomWidgetRendererProps {
  widget: CustomWidget;
  onDelete?: () => void;
  showAddToDashboard?: boolean;
}

export const CustomWidgetRenderer = ({ widget, onDelete, showAddToDashboard = false }: CustomWidgetRendererProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToDashboard, setAddingToDashboard] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWidgetData();
  }, [widget]);

  const fetchWidgetData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { query_config } = widget;
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Process data based on query config
      const processedData = processTradeData(trades || [], query_config);
      setData(processedData);
    } catch (error) {
      console.error('Error fetching widget data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load widget data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const processTradeData = (trades: any[], config: any): any => {
    const { metric, aggregation, group_by } = config;

    if (group_by) {
      // Group data
      const grouped: Record<string, any[]> = trades.reduce((acc: Record<string, any[]>, trade: any) => {
        const key = trade[group_by] || 'Unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(trade);
        return acc;
      }, {});

      return Object.entries(grouped).map(([key, tradeGroup]) => {
        const value = calculateMetric(tradeGroup, metric, aggregation);
        return { name: key, value };
      }).sort((a, b) => b.value - a.value);
    } else {
      // Single metric
      return calculateMetric(trades, metric, aggregation);
    }
  };

  const calculateMetric = (trades: any[], metric: string, aggregation: string) => {
    switch (metric) {
      case 'roi':
        const avgROI = trades.reduce((sum, t) => sum + (t.roi || 0), 0) / trades.length;
        return aggregation === 'avg' ? avgROI : avgROI;
      case 'pnl':
        return trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      case 'win_rate':
        const wins = trades.filter(t => (t.pnl || 0) > 0).length;
        return (wins / trades.length) * 100;
      case 'count':
        return trades.length;
      default:
        return 0;
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('custom_dashboard_widgets')
        .delete()
        .eq('id', widget.id);

      if (error) throw error;

      toast({
        title: 'Widget Deleted',
        description: 'The widget has been removed from your dashboard',
      });

      onDelete?.();
    } catch (error) {
      console.error('Error deleting widget:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete widget',
        variant: 'destructive',
      });
    }
  };

  const handleAddToDashboard = async () => {
    try {
      setAddingToDashboard(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from('user_settings')
        .select('layout_json')
        .eq('user_id', user.id)
        .single();

      const currentPositions = (settings?.layout_json as any[]) || [];
      const newPosition = {
        id: `custom-${widget.id}`,
        column: 0,
        row: currentPositions.length > 0 ? Math.max(...currentPositions.map((p: any) => p.row)) + 1 : 0,
      };

      await supabase
        .from('user_settings')
        .update({
          layout_json: [...currentPositions, newPosition] as any,
        })
        .eq('user_id', user.id);

      toast({
        title: 'Added to Dashboard',
        description: `"${widget.title}" has been added to your dashboard`,
      });
    } catch (error) {
      console.error('Error adding to dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to add widget to dashboard',
        variant: 'destructive',
      });
    } finally {
      setAddingToDashboard(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <Skeleton className="h-32" />
      </GlassCard>
    );
  }

  const renderMetricWidget = () => {
    const value = typeof data === 'number' ? data : 0;
    const format = widget.display_config?.format || 'number';
    const isPositive = value > 0;

    return (
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-success" />
          ) : (
            <TrendingDown className="h-5 w-5 text-destructive" />
          )}
          <span className="text-3xl font-bold">
            {format === 'currency' ? `$${formatNumber(value)}` : 
             format === 'percent' ? formatPercent(value) :
             formatNumber(value)}
          </span>
        </div>
        {widget.description && (
          <p className="text-sm text-muted-foreground">{widget.description}</p>
        )}
      </div>
    );
  };

  const renderChartWidget = () => {
    const chartData = Array.isArray(data) ? data : [];
    const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

    if (widget.display_config?.chart_type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip />
          <Bar dataKey="value" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderTableWidget = () => {
    const tableData = Array.isArray(data) ? data : [];
    const format = widget.display_config?.format || 'number';
    
    const formatValue = (val: number) => {
      if (format === 'currency') return `$${formatNumber(val)}`;
      if (format === 'percent') return formatPercent(val);
      return formatNumber(val);
    };
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 text-sm font-medium">Item</th>
              <th className="text-right p-2 text-sm font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {tableData.slice(0, 10).map((row, idx) => (
              <tr key={idx} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                <td className="p-2 text-sm">{row.name || 'Unknown'}</td>
                <td className="p-2 text-right font-medium text-sm">{formatValue(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tableData.length > 10 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Showing top 10 of {tableData.length} items
          </p>
        )}
      </div>
    );
  };

  return (
    <GlassCard className="p-6 relative group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{widget.title}</h3>
        </div>
        <div className="flex gap-2">
          {showAddToDashboard && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddToDashboard}
              disabled={addingToDashboard}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="h-4 w-4 text-primary" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {widget.widget_type === 'metric' && renderMetricWidget()}
      {widget.widget_type === 'chart' && renderChartWidget()}
      {widget.widget_type === 'table' && renderTableWidget()}
    </GlassCard>
  );
};