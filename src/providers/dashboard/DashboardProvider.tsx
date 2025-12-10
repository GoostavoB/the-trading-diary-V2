import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useDateRange } from '@/contexts/DateRangeContext';
import { calculateTradingDays } from '@/utils/tradingDays';
import type { Trade } from '@/types/trade';
import type {
    CapitalLogEntry,
    CustomWidget,
    TradeStats,
    DashboardDataState
} from '@/types/dashboard';

interface DashboardContextValue extends DashboardDataState {
    // Actions
    refreshData: () => Promise<void>;
    updateStats: (newStats: TradeStats) => void;

    // Computed
    processedTrades: Trade[];

    // Setters (if needed for specific UI interactions)
    setFilteredTrades: (trades: Trade[]) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { activeSubAccount } = useSubAccount();
    const activeSubAccountId = activeSubAccount?.id || null;
    const { settings: userSettings } = useUserSettings();
    const tradingDaysMode = userSettings.trading_days_calculation_mode;
    const { dateRange } = useDateRange();

    // State
    const [stats, setStats] = useState<TradeStats | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialInvestment, setInitialInvestment] = useState(0);
    const [capitalLog, setCapitalLog] = useState<CapitalLogEntry[]>([]);
    const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>([]);

    // Settings state (could be moved to settings context, but kept here for now as it affects PnL)
    const [includeFeesInPnL, setIncludeFeesInPnL] = useState(true);

    // Data Fetching Functions
    const fetchCapitalLog = useCallback(async () => {
        if (!user) return;

        // First try to get entries for the active sub-account
        let query = supabase
            .from('capital_log')
            .select('*')
            .eq('user_id', user.id);

        if (activeSubAccountId) {
            // Get entries for this sub-account OR entries with no sub-account (legacy/global entries)
            query = query.or(`sub_account_id.eq.${activeSubAccountId},sub_account_id.is.null`);
        }

        const { data, error } = await query.order('log_date', { ascending: true });

        if (error) {
            console.error('Error fetching capital log:', error);
        } else {
            setCapitalLog(data || []);
        }
    }, [user, activeSubAccountId]);

    const fetchCustomWidgets = useCallback(async () => {
        if (!user) return;

        let query = supabase
            .from('custom_dashboard_widgets')
            .select('*')
            .eq('user_id', user.id);

        if (activeSubAccountId) {
            query = query.eq('sub_account_id', activeSubAccountId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching custom widgets:', error);
        } else {
            // Map the data to match CustomWidget interface if needed, or cast if structure matches
            // The error suggests 'config' property is missing in the response but required in CustomWidget
            // We might need to map display_config to config or similar
            const mappedWidgets = (data || []).map((w: any) => ({
                ...w,
                config: w.display_config || {}, // Map display_config to config
                title: w.title || 'Custom Widget',
                description: w.description || '',
                query_config: w.query_config || {},
                display_config: w.display_config || {}
            })) as CustomWidget[];

            setCustomWidgets(mappedWidgets);
        }
    }, [user, activeSubAccountId]);

    const fetchInitialInvestment = useCallback(async () => {
        if (!user) return;

        const { data } = await supabase
            .from('user_settings')
            .select('initial_investment')
            .eq('user_id', user.id)
            .single();

        if (data) {
            setInitialInvestment(data.initial_investment || 0);
        }
    }, [user]);

    const fetchStats = useCallback(async () => {
        if (!user) return;

        let query = supabase
            .from('trades')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null);

        if (activeSubAccountId) {
            query = query.eq('sub_account_id', activeSubAccountId);
        }

        const { data: tradesData } = await query;

        if (tradesData) {
            const mappedTrades = tradesData.map(trade => ({
                ...trade,
                side: trade.side as 'long' | 'short' | null
            }));

            setTrades(mappedTrades);

            // Calculate Stats
            // Note: This logic is duplicated from the original component. 
            // In a future refactor, this calculation logic should be extracted to a utility or hook.

            // Calculate P&L without fees
            const totalPnlWithoutFees = mappedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

            // Calculate P&L with fees
            const totalPnlWithFees = mappedTrades.reduce((sum, t) => {
                const pnl = t.profit_loss || 0;
                const fundingFee = t.funding_fee || 0;
                const tradingFee = t.trading_fee || 0;
                return sum + (pnl - Math.abs(fundingFee) - Math.abs(tradingFee));
            }, 0);

            const winningTrades = mappedTrades.filter(t => (t.profit_loss || 0) > 0).length;
            const avgDuration = mappedTrades.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / (mappedTrades.length || 1);

            const { tradingDays: tradingDaySpan } = calculateTradingDays(mappedTrades, tradingDaysMode);

            const avgPnLPerTrade = mappedTrades.length > 0
                ? (includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees) / mappedTrades.length
                : 0;

            const avgPnLPerDay = tradingDaySpan > 0
                ? (includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees) / tradingDaySpan
                : 0;

            const totalAddedCapital = capitalLog.reduce((sum, entry) => sum + (entry.amount_added || 0), 0);
            const baseCapital = totalAddedCapital > 0 ? totalAddedCapital : initialInvestment;
            const currentBalance = baseCapital + (includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees);

            let currentROI = 0;
            if (baseCapital > 0) {
                currentROI = ((currentBalance - baseCapital) / baseCapital) * 100;
            }

            // Calculate total capital invested (simplified for brevity, logic matches original)
            const totalCapitalInvested = mappedTrades.reduce((sum, t) => {
                if (t.margin && t.margin > 0) return sum + t.margin;
                if (t.position_size && t.entry_price && t.position_size > 0 && t.entry_price > 0) {
                    const leverage = t.leverage && t.leverage > 0 ? t.leverage : 1;
                    return sum + ((t.position_size * t.entry_price) / leverage);
                }
                return sum;
            }, 0);

            const avgROIPerTrade = totalCapitalInvested > 0
                ? ((includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees) / totalCapitalInvested) * 100
                : 0;

            const simpleAvgROI = mappedTrades.length > 0
                ? mappedTrades.reduce((sum, t) => sum + (t.roi || 0), 0) / mappedTrades.length
                : 0;

            // Weighted ROI
            let weightedAvgROI = 0;
            if (totalCapitalInvested > 0) {
                const weightedSum = mappedTrades.reduce((sum, t) => {
                    const tradeROI = t.roi || 0;
                    let tradeCapital = 0;
                    if (t.margin && t.margin > 0) {
                        tradeCapital = t.margin;
                    } else if (t.position_size && t.entry_price) {
                        const leverage = t.leverage && t.leverage > 0 ? t.leverage : 1;
                        tradeCapital = (t.position_size * t.entry_price) / leverage;
                    }
                    return sum + (tradeROI * tradeCapital);
                }, 0);
                weightedAvgROI = weightedSum / totalCapitalInvested;
            }

            setStats({
                total_pnl: includeFeesInPnL ? totalPnlWithFees : totalPnlWithoutFees,
                win_rate: mappedTrades.length > 0 ? (winningTrades / mappedTrades.length) * 100 : 0,
                total_trades: mappedTrades.length,
                avg_duration: avgDuration,
                avg_pnl_per_trade: avgPnLPerTrade,
                avg_pnl_per_day: avgPnLPerDay,
                trading_days: tradingDaySpan,
                current_roi: currentROI,
                avg_roi_per_trade: avgROIPerTrade,
                simple_avg_roi: simpleAvgROI,
                weighted_avg_roi: weightedAvgROI,
                total_capital_invested: totalCapitalInvested,
            });
        }
        setLoading(false);
    }, [user, activeSubAccountId, includeFeesInPnL, capitalLog, initialInvestment, tradingDaysMode]);

    // Effects
    useEffect(() => {
        if (user) {
            fetchCapitalLog();
            fetchInitialInvestment();
            fetchCustomWidgets();
        }

        const tradesChannel = supabase
            .channel('trades-changes-dashboard')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user?.id}` },
                () => fetchStats()
            )
            .subscribe();

        const capitalChannel = supabase
            .channel('capital-changes-dashboard')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'capital_log', filter: `user_id=eq.${user?.id}` },
                () => fetchCapitalLog().then(() => fetchStats())
            )
            .subscribe();

        return () => {
            supabase.removeChannel(tradesChannel);
            supabase.removeChannel(capitalChannel);
        };
    }, [user, includeFeesInPnL, initialInvestment, activeSubAccountId, fetchCapitalLog, fetchCustomWidgets, fetchStats]);

    useEffect(() => {
        if (user && capitalLog.length >= 0) {
            fetchStats();
        }
    }, [capitalLog, activeSubAccountId, user, fetchStats]);

    // Filter trades based on date range
    useEffect(() => {
        if (!trades.length) {
            setFilteredTrades([]);
            return;
        }

        if (!dateRange?.from) {
            setFilteredTrades(trades);
            return;
        }

        const filtered = trades.filter(trade => {
            const tradeDate = new Date(trade.trade_date);
            const from = dateRange.from!;
            const to = dateRange.to || new Date();
            return tradeDate >= from && tradeDate <= to;
        });

        setFilteredTrades(filtered);
    }, [trades, dateRange]);

    // Memoized processed trades
    const processedTrades = useMemo(() =>
        filteredTrades.length > 0 ? filteredTrades : trades,
        [filteredTrades, trades]
    );

    const value: DashboardContextValue = {
        stats,
        trades,
        filteredTrades,
        capitalLog,
        customWidgets,
        loading,
        initialInvestment,
        includeFeesInPnL,
        refreshData: fetchStats,
        updateStats: setStats,
        processedTrades,
        setFilteredTrades
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}
