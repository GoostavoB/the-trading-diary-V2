
// Import Trade type from its source
import type { Trade } from '@/types/trade';

/**
 * Dashboard Type Definitions
 * 
 * Comprehensive type safety for Dashboard components and data structures.
 * Created as part of Phase 1: Foundation Fixes
 */

export interface CapitalLogEntry {
    id: string;
    user_id: string;
    sub_account_id: string | null;
    amount_added: number;
    log_date: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
}

export interface CustomWidget {
    id: string;
    user_id: string;
    sub_account_id: string | null;
    widget_type: string;
    config: WidgetConfig;
    position?: number;
    created_at: string;
    updated_at?: string;
}

export interface WidgetConfig {
    title?: string;
    visible?: boolean;
    size?: 1 | 2 | 4 | 6;
    height?: 2 | 4 | 6;
    customData?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface TradeStationControls {
    activeWidgets: string[];
    handleAddWidgetDirect: (widgetId: string) => void;
    handleRemoveWidgetDirect: (widgetId: string) => void;
}

/**
 * UI State for Dashboard
 */
export interface DashboardUIState {
    isCustomizing: boolean;
    showWidgetLibrary: boolean;
    showUpgradePrompt: boolean;
    activeTab: 'overview' | 'insights' | 'history' | 'tradestation';
    activeId: string | null;
}

/**
 * Data State for Dashboard
 */
export interface DashboardDataState {
    stats: TradeStats | null;
    trades: Trade[];
    filteredTrades: Trade[];
    capitalLog: CapitalLogEntry[];
    customWidgets: CustomWidget[];
    loading: boolean;
    initialInvestment: number;
    includeFeesInPnL: boolean;
}

// Re-export Trade type
export type { Trade };

// TradeStats interface (if not already defined elsewhere)
export interface TradeStats {
    total_pnl: number;
    win_rate: number;
    total_trades: number;
    avg_duration: number;
    avg_pnl_per_trade: number;
    avg_pnl_per_day: number;
    trading_days: number;
    current_roi: number;
    avg_roi_per_trade: number;
    simple_avg_roi: number;
    weighted_avg_roi: number;
    total_capital_invested: number;
}
