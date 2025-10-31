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
import { PersonalGoalsWidget } from '@/components/widgets/PersonalGoalsWidget';
import { LeverageCalculatorWidget } from '@/components/widgets/LeverageCalculatorWidget';
import { WeekPerformanceWidget } from '@/components/widgets/WeekPerformanceWidget';
import { WeeklyPnLChartWidget } from '@/components/widgets/WeeklyPnLChartWidget';

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
    // Tier 0: Starter (0 XP, Free)
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 0,
    tierName: 'Starter',
    educationalPurpose: 'Track your overall trading capital',
    dopamineTrigger: 'micro',
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
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 0,
    tierName: 'Starter',
    educationalPurpose: 'Monitor win/loss percentage',
    dopamineTrigger: 'micro',
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
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 0,
    tierName: 'Starter',
    educationalPurpose: 'Count your trading activity',
    dopamineTrigger: 'micro',
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
    requiredTier: 1,
    requiredPlan: 'free',
    xpToUnlock: 1000,
    tierName: 'Skilled',
    educationalPurpose: 'Portfolio holdings overview',
    dopamineTrigger: 'micro',
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
    requiredTier: 4,
    requiredPlan: 'elite',
    xpToUnlock: 25000,
    tierName: 'Elite',
    educationalPurpose: 'Pure trading profit metric',
    dopamineTrigger: 'macro',
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
    requiredTier: 1,
    requiredPlan: 'free',
    xpToUnlock: 1000,
    tierName: 'Skilled',
    educationalPurpose: 'Best performing assets',
    dopamineTrigger: 'micro',
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
    requiredTier: 4,
    requiredPlan: 'elite',
    xpToUnlock: 25000,
    tierName: 'Elite',
    educationalPurpose: 'AI-powered trading recommendations',
    dopamineTrigger: 'macro',
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
    requiredTier: 2,
    requiredPlan: 'free',
    xpToUnlock: 4000,
    tierName: 'Advanced',
    educationalPurpose: 'Latest trade activity',
    dopamineTrigger: 'micro',
  },
  
  quickActions: {
    id: 'quickActions',
    title: 'Quick Actions',
    description: 'Fast access to common actions',
    category: 'overview',
    icon: Zap,
    defaultSize: 'small',
    component: QuickActionsWidget,
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 0,
    tierName: 'Starter',
    educationalPurpose: 'Access common features quickly',
    dopamineTrigger: 'micro',
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
    requiredTier: 1,
    requiredPlan: 'free',
    xpToUnlock: 1000,
    tierName: 'Skilled',
    educationalPurpose: 'Average profit per trade',
    dopamineTrigger: 'meso',
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
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 0,
    tierName: 'Starter',
    educationalPurpose: 'Daily profit average',
    dopamineTrigger: 'meso',
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
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 0,
    tierName: 'Starter',
    educationalPurpose: 'Return on investment metric',
    dopamineTrigger: 'meso',
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
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 450,
    tierName: 'Starter',
    educationalPurpose: 'Portfolio growth chart',
    dopamineTrigger: 'meso',
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
    requiredTier: 3,
    requiredPlan: 'pro',
    xpToUnlock: 10000,
    tierName: 'Pro',
    educationalPurpose: 'Trading behavior insights',
    dopamineTrigger: 'macro',
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
    requiredTier: 3,
    requiredPlan: 'pro',
    xpToUnlock: 10000,
    tierName: 'Pro',
    educationalPurpose: 'Fee analysis and optimization',
    dopamineTrigger: 'meso',
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
    requiredTier: 3,
    requiredPlan: 'pro',
    xpToUnlock: 10000,
    tierName: 'Pro',
    educationalPurpose: 'Key performance metrics',
    dopamineTrigger: 'macro',
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
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 250,
    tierName: 'Starter',
    educationalPurpose: 'Advanced quality metrics',
    dopamineTrigger: 'macro',
  },

  heatmap: {
    id: 'heatmap',
    title: 'Weekly Heatmap',
    description: 'Visualize trading performance by day and hour',
    category: 'insights',
    icon: Grid3x3,
    defaultSize: 'large',
    component: TradingHeatmap as any,
    requiresData: ['trades'],
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 150,
    tierName: 'Starter',
    educationalPurpose: 'Time-based performance visualization',
    dopamineTrigger: 'macro',
  },

  goals: {
    id: 'goals',
    title: 'Personal Goals',
    description: 'Track your active trading goal with progress',
    category: 'trading',
    icon: Target,
    defaultSize: 'small',
    component: PersonalGoalsWidget as any,
    requiresData: [],
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 0,
    tierName: 'Starter',
    educationalPurpose: 'Set and track trading objectives',
    dopamineTrigger: 'meso',
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
    requiredTier: 2,
    requiredPlan: 'free',
    xpToUnlock: 4000,
    tierName: 'Advanced',
    educationalPurpose: 'Long/short ratio analysis',
    dopamineTrigger: 'micro',
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
    requiredTier: 4,
    requiredPlan: 'elite',
    xpToUnlock: 25000,
    tierName: 'Elite',
    educationalPurpose: 'Market open interest data',
    dopamineTrigger: 'meso',
  },
  leverageCalculator: {
    id: 'leverageCalculator',
    title: 'Leverage Calculator',
    description: 'Calculate safe position sizes based on your stop loss distance',
    category: 'trading',
    icon: Activity,
    defaultSize: 'large',
    component: LeverageCalculatorWidget as any,
    requiresData: [],
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 50,
    tierName: 'Starter',
    educationalPurpose: 'Learn proper position sizing and risk management',
    dopamineTrigger: 'micro',
  },
  weekPerformance: {
    id: 'weekPerformance',
    title: 'Week Performance',
    description: 'Current week P&L (Monday to Sunday) - resets every Monday',
    category: 'performance',
    icon: Calendar,
    defaultSize: 'small',
    component: WeekPerformanceWidget as any,
    requiresData: ['trades'],
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 350,
    tierName: 'Starter',
    educationalPurpose: 'Weekly profit/loss summary',
    dopamineTrigger: 'micro',
  },
  weeklyPnLChart: {
    id: 'weeklyPnLChart',
    title: 'Weekly P&L - Last 8 Weeks',
    description: 'Historical weekly P&L chart - 8 weeks (24 when expanded)',
    category: 'performance',
    icon: LineChart,
    defaultSize: 'large',
    component: WeeklyPnLChartWidget as any,
    requiresData: [],
    requiredTier: 0,
    requiredPlan: 'free',
    xpToUnlock: 550,
    tierName: 'Starter',
    educationalPurpose: 'Weekly profit/loss trends',
    dopamineTrigger: 'meso',
  },
};

/**
 * Default dashboard layout for new users - Only 4 starter widgets
 */
export const DEFAULT_DASHBOARD_LAYOUT = [
  // Starter Pack - Only 4 core metrics (always unlocked)
  'currentROI',
  'winRate',
  'avgPnLPerDay',
  'totalTrades',
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
