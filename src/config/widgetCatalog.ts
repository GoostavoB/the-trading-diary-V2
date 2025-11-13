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
  TrendingDown,
  AlertCircle,
  Calculator,
  Lock,
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
import { PortfolioOverviewWidget } from '@/components/widgets/PortfolioOverviewWidget';
import { AvgPnLPerTradeWidget } from '@/components/widgets/AvgPnLPerTradeWidget';
import { AvgPnLPerDayWidget } from '@/components/widgets/AvgPnLPerDayWidget';
import { CurrentROIWidget } from '@/components/widgets/CurrentROIWidget';
import { AvgROIPerTradeWidget } from '@/components/widgets/AvgROIPerTradeWidget';
import { CapitalGrowthWidget } from '@/components/widgets/CapitalGrowthWidget';
import { CombinedPnLROIWidget } from '@/components/widgets/CombinedPnLROIWidget';
import { BehaviorAnalytics } from '@/components/insights/BehaviorAnalytics';
import { CostEfficiencyPanel } from '@/components/insights/CostEfficiencyPanel';
import { PerformanceHighlights } from '@/components/insights/PerformanceHighlights';
import { TradingQualityMetrics } from '@/components/insights/TradingQualityMetrics';
import { TradingHeatmap } from '@/components/TradingHeatmap';
import { GoalWidget } from '@/components/goals/GoalWidget';
import { RollingTargetWidget } from '@/components/widgets/RollingTargetWidget';
import { EmotionMistakeCorrelationWidget } from '@/components/widgets/EmotionMistakeCorrelationWidget';
// Import Trade Station widgets to make them available in Overview too
import { ErrorReflectionWidget } from '@/components/trade-station/ErrorReflectionWidget';
import { RiskCalculatorV2Widget } from '@/components/trade-station/RiskCalculatorV2Widget';
import { TradeStationRollingTarget } from '@/components/trade-station/TradeStationRollingTarget';
import { DailyLossLockStatus } from '@/components/trade-station/DailyLossLockStatus';
import { SimpleLeverageWidget } from '@/components/trade-station/SimpleLeverageWidget';

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
  
  portfolioOverview: {
    id: 'portfolioOverview',
    title: 'Portfolio Overview',
    description: 'Portfolio value chart over time',
    category: 'portfolio',
    icon: LineChart,
    defaultSize: 'medium',
    component: PortfolioOverviewWidget,
    requiresData: ['stats', 'trades'],
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
    description: 'Return on investment from initial capital',
    category: 'performance',
    icon: TrendingUp,
    defaultSize: 'small',
    component: CurrentROIWidget,
    requiresData: ['stats'],
  },

  avgROIPerTrade: {
    id: 'avgROIPerTrade',
    title: 'Avg ROI Per Trade',
    description: 'Average ROI across all trades',
    category: 'performance',
    icon: Percent,
    defaultSize: 'small',
    component: AvgROIPerTradeWidget,
    requiresData: ['stats'],
  },

  capitalGrowth: {
    id: 'capitalGrowth',
    title: 'Capital Growth',
    description: 'Visualize your capital growth over time',
    category: 'performance',
    icon: TrendingUp,
    defaultSize: 'large',
    component: CapitalGrowthWidget,
    requiresData: ['stats', 'trades'],
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

  // rollingTarget removed - it's a Trade Station specific widget with wrapper
  // Users can still add it from Trade Station where it's properly configured

  combinedPnLROI: {
    id: 'combinedPnLROI',
    title: 'Avg P&L & ROI',
    description: 'Average P&L and ROI per trade combined',
    category: 'performance',
    icon: BarChart3,
    defaultSize: 'small',
    component: CombinedPnLROIWidget,
    requiresData: ['stats'],
  },

  emotionMistakeCorrelation: {
    id: 'emotionMistakeCorrelation',
    title: 'Emotion & Mistake Patterns',
    description: 'Correlations between emotions/mistakes and trading performance',
    category: 'insights',
    icon: Brain,
    defaultSize: 'large',
    component: EmotionMistakeCorrelationWidget,
    requiresData: ['trades'],
  },
  
  // Trade Station widgets - also available in Overview
  errorReflection: {
    id: 'errorReflection',
    title: 'Error Reflection',
    description: 'Track and reflect on trading mistakes',
    category: 'trading',
    icon: AlertCircle,
    defaultSize: 'medium',
    component: ErrorReflectionWidget,
  },
  riskCalculator: {
    id: 'riskCalculator',
    title: 'Risk Calculator',
    description: 'Calculate position size and risk',
    category: 'trading',
    icon: Calculator,
    defaultSize: 'medium',
    component: RiskCalculatorV2Widget,
  },
  dailyLossLock: {
    id: 'dailyLossLock',
    title: 'Daily Loss Lock',
    description: 'Monitor daily loss limits',
    category: 'trading',
    icon: Lock,
    defaultSize: 'small',
    component: DailyLossLockStatus,
  },
  simpleLeverage: {
    id: 'simpleLeverage',
    title: 'Leverage Calculator',
    description: 'Simple leverage calculation',
    category: 'trading',
    icon: TrendingUp,
    defaultSize: 'small',
    component: SimpleLeverageWidget,
  },
};

/**
 * Default Command Center layout for new users - comprehensive performance overview
 * Includes: ROI, Capital Growth, Avg P&L/Day, Win Rate, Top Movers, Combined P&L/ROI,
 * Active Goals, AI Insights, Emotion/Mistake Patterns, Behavior, Cost Efficiency,
 * Performance Highlights, and Trading Quality
 */
export const DEFAULT_DASHBOARD_LAYOUT = [
  'currentROI',
  'capitalGrowth',
  'avgPnLPerDay',
  'winRate',
  'topMovers',
  'combinedPnLROI',
  'activeGoals',
  'aiInsights',
  'emotionMistakeCorrelation',
  'behaviorAnalytics',
  'costEfficiency',
  'performanceHighlights',
  'tradingQuality',
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
  { id: 'all', label: 'All', description: 'Browse all available widgets' },
  { id: 'overview', label: 'Overview', description: 'Essential dashboard metrics' },
  { id: 'trading', label: 'Trading', description: 'Win rate, trades, and performance' },
  { id: 'portfolio', label: 'Portfolio', description: 'Holdings and allocation' },
  { id: 'market', label: 'Market Data', description: 'Price movements and market info' },
  { id: 'performance', label: 'Performance', description: 'ROI, P&L, and analytics' },
  { id: 'insights', label: 'Insights', description: 'Advanced trading analytics' },
  { id: 'ai', label: 'AI & Insights', description: 'AI-powered recommendations' },
];
