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
    defaultLayout: {
      w: 3,
      h: 360,
      minW: 3,
      minH: 360,
      maxW: 6,
      maxH: 600,
    },
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
    defaultLayout: {
      w: 3,
      h: 360,
      minW: 3,
      minH: 360,
      maxW: 6,
      maxH: 600,
    },
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
    defaultLayout: {
      w: 3,
      h: 360,
      minW: 3,
      minH: 360,
      maxW: 6,
      maxH: 600,
    },
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
    defaultLayout: {
      w: 3,
      h: 360,
      minW: 3,
      minH: 360,
      maxW: 6,
      maxH: 600,
    },
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
    defaultLayout: {
      w: 6,
      h: 720,
      minW: 6,
      minH: 600,
      maxW: 12,
      maxH: 960,
    },
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
    defaultLayout: {
      w: 3,
      h: 600,
      minW: 3,
      minH: 480,
      maxW: 6,
      maxH: 720,
    },
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
    defaultLayout: {
      w: 3,
      h: 600,
      minW: 3,
      minH: 480,
      maxW: 6,
      maxH: 720,
    },
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
    defaultLayout: {
      w: 6,
      h: 720,
      minW: 6,
      minH: 600,
      maxW: 12,
      maxH: 960,
    },
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
    defaultLayout: {
      w: 3,
      h: 360,
      minW: 3,
      minH: 360,
      maxW: 4,
      maxH: 600,
    },
    component: QuickActionsWidget,
  },

  avgPnLPerTrade: {
    id: 'avgPnLPerTrade',
    title: 'Avg P&L Per Trade',
    description: 'Average profit/loss per executed trade',
    category: 'performance',
    icon: BarChart3,
    defaultSize: 'small',
    defaultLayout: {
      w: 3,
      h: 360,
      minW: 3,
      minH: 360,
      maxW: 6,
      maxH: 600,
    },
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
    defaultLayout: {
      w: 3,
      h: 360,
      minW: 3,
      minH: 360,
      maxW: 6,
      maxH: 600,
    },
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
    defaultLayout: {
      w: 3,
      h: 360,
      minW: 3,
      minH: 360,
      maxW: 6,
      maxH: 600,
    },
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
    defaultLayout: {
      w: 3,
      h: 360,
      minW: 3,
      minH: 360,
      maxW: 6,
      maxH: 600,
    },
    component: AvgROIPerTradeWidget,
    requiresData: ['stats'],
  },
};

/**
 * Default dashboard layout for new users
 */
export const DEFAULT_DASHBOARD_LAYOUT = [
  // Row 1: 4 small widgets (360px tall)
  { i: 'totalBalance', x: 0, y: 0, w: 3, h: 360 },
  { i: 'spotWallet', x: 3, y: 0, w: 3, h: 360 },
  { i: 'winRate', x: 6, y: 0, w: 3, h: 360 },
  { i: 'totalTrades', x: 9, y: 0, w: 3, h: 360 },
  
  // Row 2: Performance metrics (4 widgets - 360px tall)
  { i: 'avgPnLPerTrade', x: 0, y: 360, w: 3, h: 360 },
  { i: 'avgPnLPerDay', x: 3, y: 360, w: 3, h: 360 },
  { i: 'currentROI', x: 6, y: 360, w: 3, h: 360 },
  { i: 'avgROIPerTrade', x: 9, y: 360, w: 3, h: 360 },
  
  // Row 3: Portfolio Overview (720px) + Top Movers (600px) + Quick Actions (360px)
  { i: 'portfolioOverview', x: 0, y: 720, w: 6, h: 720 },
  { i: 'topMovers', x: 6, y: 720, w: 3, h: 600 },
  { i: 'quickActions', x: 9, y: 720, w: 3, h: 360 },
  
  // Row 4: Recent Transactions (720px) + AI Insights (600px)
  { i: 'recentTransactions', x: 0, y: 1440, w: 6, h: 720 },
  { i: 'aiInsights', x: 6, y: 1440, w: 6, h: 600 },
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
  { id: 'ai', label: 'AI & Insights', description: 'AI-powered recommendations' },
];
