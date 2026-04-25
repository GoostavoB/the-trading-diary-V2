import { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, TrendingDown, DollarSign, AlertTriangle, Calendar, ArrowUpDown, Search, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trade } from '@/types/trade';
import { UserError } from '@/hooks/useErrorReflection';
import { formatCurrency } from '@/utils/formatNumber';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ErrorImpact {
  errorTag: string;
  totalOccurrences: number;
  totalPnL: number;
  avgPnL: number;
  lastOccurrence: string;
}

type SortField = 'totalOccurrences' | 'totalPnL' | 'avgPnL' | 'errorTag';
type SortDirection = 'asc' | 'desc';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6'];

export default function ErrorAnalytics() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [sortField, setSortField] = useState<SortField>('totalPnL');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch tracked errors from user_errors table
  const { data: trackedErrors } = useQuery({
    queryKey: ['tracked-errors', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_errors')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(e => ({
        id: e.id,
        text: e.error_text,
        created_at: e.created_at,
        expires_at: e.expires_at,
        status: e.status as 'active' | 'archived',
      })) as UserError[];
    },
    enabled: !!user?.id,
  });

  // Fetch all trades with error tags
  const { data: tradesWithErrors, isLoading } = useQuery({
    queryKey: ['trades-with-errors', user?.id, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .not('error_tags', 'is', null)
        .is('deleted_at', null)
        .order('trade_date', { ascending: false });

      if (dateFilter !== 'all') {
        const daysAgo = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        query = query.gte('trade_date', cutoffDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Trade[];
    },
    enabled: !!user?.id,
  });

  // Calculate error impact statistics
  const errorImpacts = useMemo<ErrorImpact[]>(() => {
    if (!tradesWithErrors) return [];

    const impactMap = new Map<string, ErrorImpact>();

    tradesWithErrors.forEach((trade) => {
      const errorTags = trade.error_tags || [];
      // Calculate net PnL (including fees)
      const pnl = (trade.pnl || 0);
      const fundingFee = trade.funding_fee || 0;
      const tradingFee = trade.trading_fee || 0;
      const netPnL = pnl - Math.abs(fundingFee) - Math.abs(tradingFee);
      const tradeDate = trade.trade_date || trade.created_at;

      errorTags.forEach((tag) => {
        if (!impactMap.has(tag)) {
          impactMap.set(tag, {
            errorTag: tag,
            totalOccurrences: 0,
            totalPnL: 0,
            avgPnL: 0,
            lastOccurrence: tradeDate,
          });
        }

        const impact = impactMap.get(tag)!;
        impact.totalOccurrences++;
        impact.totalPnL += netPnL;
        if (tradeDate > impact.lastOccurrence) {
          impact.lastOccurrence = tradeDate;
        }
      });
    });

    // Calculate averages
    impactMap.forEach((impact) => {
      impact.avgPnL = impact.totalPnL / impact.totalOccurrences;
    });

    return Array.from(impactMap.values());
  }, [tradesWithErrors]);

  // Filter and sort
  const filteredAndSortedErrors = useMemo(() => {
    const filtered = errorImpacts.filter((e) =>
      e.errorTag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'errorTag') {
        return multiplier * a.errorTag.localeCompare(b.errorTag);
      }
      return multiplier * ((a[sortField] as number) - (b[sortField] as number));
    });

    return filtered;
  }, [errorImpacts, searchQuery, sortField, sortDirection]);

  // Stats for cards
  const totalErrors = errorImpacts.reduce((sum, e) => sum + e.totalOccurrences, 0);
  const totalLoss = errorImpacts.reduce((sum, e) => sum + (e.totalPnL < 0 ? e.totalPnL : 0), 0);
  const mostCostlyError = errorImpacts.length > 0
    ? [...errorImpacts].sort((a, b) => a.totalPnL - b.totalPnL)[0]
    : null;
  const mostFrequentError = errorImpacts.length > 0
    ? [...errorImpacts].sort((a, b) => b.totalOccurrences - a.totalOccurrences)[0]
    : null;

  // Chart data - top 8 most costly errors
  const chartData = useMemo(() => {
    return [...errorImpacts]
      .sort((a, b) => a.totalPnL - b.totalPnL)
      .slice(0, 8)
      .map(e => ({
        name: e.errorTag.length > 20 ? e.errorTag.substring(0, 20) + '...' : e.errorTag,
        loss: Math.abs(e.totalPnL < 0 ? e.totalPnL : 0),
        occurrences: e.totalOccurrences,
      }));
  }, [errorImpacts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <>
      <SEO
        title={pageMeta.errorAnalytics.title}
        description={pageMeta.errorAnalytics.description}
        keywords={pageMeta.errorAnalytics.keywords}
        canonical={pageMeta.errorAnalytics.canonical}
        noindex={true}
      />
      <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Error Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Analyze trading mistakes and their financial impact
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <PremiumCard>
            <div className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
              <h3 className="text-sm font-medium">Total Errors</h3>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{totalErrors}</div>
              <p className="text-xs text-muted-foreground">
                Across {errorImpacts.length} unique mistake types
              </p>
            </div>
          </PremiumCard>

          <PremiumCard>
            <div className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
              <h3 className="text-sm font-medium">Total Loss from Errors</h3>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(totalLoss)}
              </div>
              <p className="text-xs text-muted-foreground">
                In selected time period
              </p>
            </div>
          </PremiumCard>

          <PremiumCard>
            <div className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
              <h3 className="text-sm font-medium">Most Costly Mistake</h3>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-sm font-bold truncate">
                {mostCostlyError?.errorTag || 'N/A'}
              </div>
              <p className="text-xs text-destructive">
                {mostCostlyError ? formatCurrency(mostCostlyError.totalPnL) : '-'}
              </p>
            </div>
          </PremiumCard>

          <PremiumCard>
            <div className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
              <h3 className="text-sm font-medium">Most Frequent Error</h3>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-sm font-bold truncate">
                {mostFrequentError?.errorTag || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {mostFrequentError ? `${mostFrequentError.totalOccurrences} occurrences` : '-'}
              </p>
            </div>
          </PremiumCard>
        </div>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <PremiumCard>
            <div className="p-6 pb-2">
              <h3 className="text-lg font-semibold">Most Costly Mistakes</h3>
              <p className="text-sm text-muted-foreground">Top 8 mistakes by total loss impact</p>
            </div>
            <div className="p-6 pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="loss" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PremiumCard>
        )}

        {/* Filters and Table */}
        <PremiumCard>
          <div className="p-6 pb-2">
            <h3 className="text-lg font-semibold">Error Details</h3>
            <p className="text-sm text-muted-foreground">
              Detailed breakdown of each mistake type
            </p>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Search Errors
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by error name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="w-full sm:w-[200px]">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Time Period
                </Label>
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredAndSortedErrors.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No error data found for the selected period
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('errorTag')}
                          className="h-8 px-2"
                        >
                          Error Type
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('totalOccurrences')}
                          className="h-8 px-2"
                        >
                          Occurrences
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('totalPnL')}
                          className="h-8 px-2"
                        >
                          Total PnL Impact
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('avgPnL')}
                          className="h-8 px-2"
                        >
                          Avg PnL per Error
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Last Occurrence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedErrors.map((error) => (
                      <TableRow key={error.errorTag}>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="text-xs">
                            {error.errorTag}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {error.totalOccurrences}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              error.totalPnL < 0
                                ? 'text-destructive font-semibold'
                                : 'text-success'
                            }
                          >
                            {formatCurrency(error.totalPnL)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              error.avgPnL < 0
                                ? 'text-destructive'
                                : 'text-success'
                            }
                          >
                            {formatCurrency(error.avgPnL)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {format(new Date(error.lastOccurrence), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </PremiumCard>

        {/* Active Tracked Errors */}
        {trackedErrors && trackedErrors.length > 0 && (
          <PremiumCard>
            <div className="p-6 pb-2">
              <h3 className="text-lg font-semibold">Currently Tracked Errors</h3>
              <p className="text-sm text-muted-foreground">
                Errors you're actively working to avoid (from Error Reflection Widget)
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-2">
                {trackedErrors
                  .filter((e) => e.status === 'active')
                  .map((error) => (
                    <div
                      key={error.id}
                      className="flex items-start justify-between p-3 rounded-lg border bg-accent/5"
                    >
                      <p className="text-sm flex-1">{error.text}</p>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Expires {format(new Date(error.expires_at), 'MMM d')}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </PremiumCard>
        )}
      </div>
    </AppLayout>
    </>
  );
}
