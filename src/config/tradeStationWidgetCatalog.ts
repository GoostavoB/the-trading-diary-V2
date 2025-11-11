import { AlertCircle, Calculator, Target, Lock, TrendingUp, Zap } from 'lucide-react';
import { WidgetConfig } from '@/types/widget';
import { ErrorReflectionWidget } from '@/components/trade-station/ErrorReflectionWidget';
import { QuickActionCard } from '@/components/QuickActionCard';
import { RiskCalculatorV2Widget } from '@/components/trade-station/RiskCalculatorV2Widget';
import { TradeStationRollingTarget } from '@/components/trade-station/TradeStationRollingTarget';
import { DailyLossLockStatus } from '@/components/trade-station/DailyLossLockStatus';
import { SimpleLeverageWidget } from '@/components/trade-station/SimpleLeverageWidget';

export const TRADE_STATION_WIDGET_CATALOG: Record<string, WidgetConfig> = {
  errorReflection: {
    id: 'errorReflection',
    title: 'Error Reflection',
    description: 'Track and reflect on trading mistakes',
    category: 'trading',
    icon: AlertCircle,
    defaultSize: 'medium',
    component: ErrorReflectionWidget,
  },
  quickActions: {
    id: 'quickActions',
    title: 'Quick Actions',
    description: 'Fast access to common trading actions',
    category: 'overview',
    icon: Zap,
    defaultSize: 'small',
    component: QuickActionCard,
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
  rollingTarget: {
    id: 'rollingTarget',
    title: 'Rolling Target',
    description: 'Daily rolling profit targets',
    category: 'trading',
    icon: Target,
    defaultSize: 'large',
    component: TradeStationRollingTarget,
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

export const DEFAULT_TRADE_STATION_LAYOUT = [
  'errorReflection',
  'quickActions',
  'riskCalculator',
  'rollingTarget',
  'dailyLossLock',
  'simpleLeverage',
];
