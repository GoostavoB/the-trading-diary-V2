import { 
  DollarSign, 
  Target, 
  BarChart3, 
  Wallet, 
  TrendingUp,
  Brain,
  Clock,
  Zap,
  PieChart,
  Activity,
  Trophy,
  LineChart,
  Percent,
  Calendar,
  Grid3x3,
} from 'lucide-react';
import { WidgetConfig, WIDGET_SIZES } from '@/types/widget';
import { TotalBalanceWidget } from '@/components/widgets/TotalBalanceWidget';
import { WinRateWidget } from '@/components/widgets/WinRateWidget';
import { TotalTradesWidget } from '@/components/widgets/TotalTradesWidget';
import { SpotWalletWidget } from '@/components/widgets/SpotWalletWidget';
import { TopMoversWidget } from '@/components/widgets/TopMoversWidget';
import { AIInsightsWidget } from '@/components/widgets/AIInsightsWidget';
import { RecentTransactionsWidget } from '@/components/widgets/RecentTransactionsWidget';
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget';
import { AvgPnLPerTradeWidget } from '@/components/widgets/AvgPnLPerTradeWidget';
import { AvgPnLPerDayWidget } from '@/components/widgets/AvgPnLPerDayWidget';
import { CurrentROIWidget } from '@/components/widgets/CurrentROIWidget';
import { CapitalGrowthWidget } from '@/components/widgets/CapitalGrowthWidget';
import { AbsoluteProfitWidget } from '@/components/widgets/AbsoluteProfitWidget';
import { BehaviorAnalytics } from '@/components/insights/BehaviorAnalytics';
import { CostEfficiencyPanel } from '@/components/insights/CostEfficiencyPanel';
import { PerformanceHighlights } from '@/components/insights/PerformanceHighlights';
import { TradingQualityMetrics } from '@/components/insights/TradingQualityMetrics';
import { TradingHeatmap } from '@/components/TradingHeatmap';
import { GoalWidget } from '@/components/goals/GoalWidget';
import { LSRWidget } from '@/components/widgets/LSRWidget';
import { OpenInterestWidget } from '@/components/widgets/OpenInterestWidget';

/**
 * Widget Catalog - Registry of all available dashboard widgets
 * This is the single source of truth for widget definitions
 */
export const WIDGET_CATALOG: Record<string, WidgetConfig> = {
  totalBalance: {
    id: 'totalBalance',
    title: 'Total Balance',
    description: 'Your total trading account balance with 24h change',
    category: 'overview',
    icon: DollarSign,
    defaultSize: 'small',
    component: TotalBalanceWidget,
    requiresData: ['stats'],
  },
  
  winRate: {
    id: 'winRate',
    title: 'Win Rate',
    description: 'Your win rate percentage and W/L ratio',
    category: 'trading',
    icon: Target,
    defaultSize: 'small',
    component: WinRateWidget,
    requiresData: ['stats'],
  },
  
  totalTrades: {
    id: 'totalTrades',
    title: 'Total Trades',
    description: 'Total number of trades executed',
    category: 'trading',
    icon: BarChart3,
    defaultSize: 'small',
    component: TotalTradesWidget,
    requiresData: ['stats'],
  },
  
  spotWallet: {
    id: 'spotWallet',
    title: 'Spot Wallet',
    description: 'Quick overview of your spot wallet holdings',
    category: 'portfolio',
    icon: Wallet,
    defaultSize: 'small',
    component: SpotWalletWidget,
    requiresData: ['holdings'],
  },
  
  absoluteProfit: {
    id: 'absoluteProfit',
    title: 'Total Trading Profit',
    description: 'Pure trading profit excluding deposits/withdrawals',
    category: 'performance',
    icon: TrendingUp,
    defaultSize: 'small',
    component: AbsoluteProfitWidget,
    requiresData: ['trades'],
  },
  
  topMovers: {
    id: 'topMovers',
    title: 'Top Movers',
    description: 'Assets with biggest price movements',
    category: 'market',
    icon: TrendingUp,
    defaultSize: 'small',
    component: TopMoversWidget,
    requiresData: ['trades'],
  },
  
  aiInsights: {
    id: 'aiInsights',
    title: 'AI Insights',
    description: 'AI-powered trading insights and recommendations',
    category: 'ai',
    icon: Brain,
    defaultSize: 'small',
    component: AIInsightsWidget,
    isPremium: false,
  },
  
  recentTransactions: {
    id: 'recentTransactions',
    title: 'Recent Transactions',
    description: 'Your latest trading activity',
    category: 'trading',
    icon: Clock,
    defaultSize: 'medium',
    component: RecentTransactionsWidget,
    requiresData: ['trades'],
  },
  
  quickActions: {
    id: 'quickActions',
    title: 'Quick Actions',
    description: 'Fast access to common actions',
    category: 'overview',
    icon: Zap,
    defaultSize: 'small',
    component: QuickActionsWidget,
  },

  avgPnLPerTrade: {
    id: 'avgPnLPerTrade',
    title: 'Avg P&L Per Trade',
    description: 'Average profit/loss per executed trade',
    category: 'performance',
    icon: BarChart3,
    defaultSize: 'small',
    component: AvgPnLPerTradeWidget,
    requiresData: ['stats'],
  },

  avgPnLPerDay: {
    id: 'avgPnLPerDay',
    title: 'Avg P&L Per Day',
    description: 'Average profit/loss per trading day',
    category: 'performance',
    icon: Calendar,
    defaultSize: 'small',
    component: AvgPnLPerDayWidget,
    requiresData: ['stats'],
  },

  currentROI: {
    id: 'currentROI',
    title: 'Current ROI',
    description: 'Total return on investment regardless of withdrawals',
    category: 'performance',
    icon: TrendingUp,
    defaultSize: 'small',
    component: CurrentROIWidget,
    requiresData: ['stats'],
  },

  capitalGrowth: {
    id: 'capitalGrowth',
    title: 'Capital Growth',
    description: 'Track your capital including deposits, withdrawals, and trading P&L',
    category: 'performance',
    icon: TrendingUp,
    defaultSize: 'large',
    component: CapitalGrowthWidget,
    requiresData: [],
  },

  behaviorAnalytics: {
    id: 'behaviorAnalytics',
    title: 'Behavior Analytics',
    description: 'Analyze your trading patterns and behaviors',
    category: 'insights',
    icon: Activity,
    defaultSize: 'large',
    component: BehaviorAnalytics as any,
    requiresData: ['trades'],
  },

  costEfficiency: {
    id: 'costEfficiency',
    title: 'Cost Efficiency',
    description: 'Track fees and exchange cost analysis',
    category: 'insights',
    icon: DollarSign,
    defaultSize: 'medium',
    component: CostEfficiencyPanel as any,
    requiresData: ['trades'],
  },

  performanceHighlights: {
    id: 'performanceHighlights',
    title: 'Performance Highlights',
    description: 'Best/worst trades and current streaks',
    category: 'insights',
    icon: Trophy,
    defaultSize: 'medium',
    component: PerformanceHighlights as any,
    requiresData: ['trades'],
  },

  tradingQuality: {
    id: 'tradingQuality',
    title: 'Trading Quality Metrics',
    description: 'Win/loss analysis and profit factor',
    category: 'insights',
    icon: BarChart3,
    defaultSize: 'medium',
    component: TradingQualityMetrics as any,
    requiresData: ['stats'],
  },

  heatmap: {
    id: 'heatmap',
    title: 'Trading Heatmap',
    description: 'Visualize trading performance by day and hour',
    category: 'insights',
    icon: Grid3x3,
    defaultSize: 'large',
    component: TradingHeatmap as any,
    requiresData: ['trades'],
  },

  goals: {
    id: 'goals',
    title: 'Active Goals',
    description: 'Track progress on your trading goals with projections',
    category: 'trading',
    icon: Target,
    defaultSize: 'large',
    component: GoalWidget as any,
    requiresData: [],
  },
  lsrMarketData: {
    id: 'lsrMarketData',
    title: 'Market Sentiment',
    description: 'Real-time Long/Short Ratio and Open Interest for BTCUSDT',
    category: 'market',
    icon: Activity,
    defaultSize: 'small',
    component: LSRWidget as any,
    requiresData: [],
  },
  openInterestChart: {
    id: 'openInterestChart',
    title: 'Open Interest Chart',
    description: 'Historical open interest trends with customizable symbols',
    category: 'market',
    icon: TrendingUp,
    defaultSize: 'large',
    component: OpenInterestWidget as any,
    requiresData: [],
  },
};

/**
 * Default dashboard layout for new users - simplified to just widget IDs in order
 */
export const DEFAULT_DASHBOARD_LAYOUT = [
  // Most important widget
  'absoluteProfit',
  
  // Top row
  'currentROI',
  'winRate',
  'avgPnLPerTrade',
  'avgPnLPerDay',
  
  // Second row
  'capitalGrowth',
  'heatmap',
  'topMovers',
  
  // Third row
  'behaviorAnalytics',
  
  // Additional widgets
  'totalBalance',
  'spotWallet',
  'totalTrades',
  'goals',
  'recentTransactions',
  'aiInsights',
  'quickActions',
];

/**
 * Get widgets by category
 */
export const getWidgetsByCategory = (category: string) => {
  return Object.values(WIDGET_CATALOG).filter(w => w.category === category);
};

/**
 * Get all widget categories
 */
export const WIDGET_CATEGORIES = [
  { id: 'overview', label: 'Overview', description: 'Essential dashboard metrics' },
  { id: 'trading', label: 'Trading', description: 'Win rate, trades, and performance' },
  { id: 'portfolio', label: 'Portfolio', description: 'Holdings and allocation' },
  { id: 'market', label: 'Market Data', description: 'Price movements and market info' },
  { id: 'performance', label: 'Performance', description: 'ROI, P&L, and analytics' },
  { id: 'insights', label: 'Insights', description: 'Advanced trading analytics' },
  { id: 'ai', label: 'AI & Insights', description: 'AI-powered recommendations' },
];
