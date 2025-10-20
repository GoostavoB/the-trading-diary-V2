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
      h: 3,
      minW: 3,
      minH: 3,
      maxW: 6,
      maxH: 5,
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
      h: 3,
      minW: 3,
      minH: 3,
      maxW: 6,
      maxH: 5,
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
      h: 3,
      minW: 3,
      minH: 3,
      maxW: 6,
      maxH: 5,
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
      h: 3,
      minW: 3,
      minH: 3,
      maxW: 6,
      maxH: 5,
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
      h: 5,
      minW: 6,
      minH: 4,
      maxW: 12,
      maxH: 8,
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
      h: 4,
      minW: 3,
      minH: 3,
      maxW: 6,
      maxH: 6,
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
      h: 4,
      minW: 3,
      minH: 3,
      maxW: 6,
      maxH: 6,
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
      h: 5,
      minW: 6,
      minH: 4,
      maxW: 12,
      maxH: 8,
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
      h: 3,
      minW: 3,
      minH: 3,
      maxW: 4,
      maxH: 5,
    },
    component: QuickActionsWidget,
  },
};

/**
 * Default dashboard layout for new users
 */
export const DEFAULT_DASHBOARD_LAYOUT = [
  // Row 1: 4 small widgets (3 grid units tall)
  { i: 'totalBalance', x: 0, y: 0, w: 3, h: 3 },
  { i: 'spotWallet', x: 3, y: 0, w: 3, h: 3 },
  { i: 'winRate', x: 6, y: 0, w: 3, h: 3 },
  { i: 'totalTrades', x: 9, y: 0, w: 3, h: 3 },
  
  // Row 2: Portfolio Overview (6) + Top Movers (3) + Quick Actions (3)
  { i: 'portfolioOverview', x: 0, y: 3, w: 6, h: 5 },
  { i: 'topMovers', x: 6, y: 3, w: 3, h: 4 },
  { i: 'quickActions', x: 9, y: 3, w: 3, h: 3 },
  
  // Row 3: Recent Transactions (6) + AI Insights (6)
  { i: 'recentTransactions', x: 0, y: 8, w: 6, h: 5 },
  { i: 'aiInsights', x: 6, y: 8, w: 6, h: 4 },
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
