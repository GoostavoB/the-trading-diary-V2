import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Target, 
  Shield, 
  TrendingUp, 
  DollarSign, 
  LineChart,
  Receipt,
  Search,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CalculatorCategory {
  title: string;
  calculators: {
    name: string;
    description: string;
    icon: any;
    path: string;
    badge?: string;
  }[];
}

const CALCULATOR_CATEGORIES: CalculatorCategory[] = [
  {
    title: 'Risk Management',
    calculators: [
      {
        name: 'Position Size Calculator',
        description: 'Calculate optimal position size based on account risk',
        icon: Shield,
        path: '/tools',
        badge: 'Essential'
      },
      {
        name: 'Stop Loss Calculator',
        description: 'Advanced stop loss with take profit levels',
        icon: Target,
        path: '/tools',
        badge: 'Popular'
      },
      {
        name: 'Risk/Reward Calculator',
        description: 'Analyze risk/reward ratios for trades',
        icon: TrendingUp,
        path: '/tools'
      }
    ]
  },
  {
    title: 'Leverage & Margin',
    calculators: [
      {
        name: 'Leverage Calculator',
        description: 'Calculate safe leverage and liquidation prices',
        icon: Zap,
        path: '/risk-management',
        badge: 'Advanced'
      },
      {
        name: 'Margin Calculator',
        description: 'Determine margin requirements',
        icon: DollarSign,
        path: '/risk-management'
      }
    ]
  },
  {
    title: 'Performance Analysis',
    calculators: [
      {
        name: 'Kelly Criterion',
        description: 'Optimal position sizing based on win rate',
        icon: LineChart,
        path: '/tools'
      }
    ]
  },
  {
    title: 'Financial Planning',
    calculators: [
      {
        name: 'Expense Tracker',
        description: 'Track trading costs and expenses',
        icon: Receipt,
        path: '/tools'
      }
    ]
  }
];

const Calculators = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = CALCULATOR_CATEGORIES.map(category => ({
    ...category,
    calculators: category.calculators.filter(calc =>
      calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      calc.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.calculators.length > 0);

  return (
    <AppLayout>
      <main className="space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold">Trading Calculators</h1>
          <p className="text-muted-foreground mt-1">
            Professional tools for risk management and trade analysis
          </p>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search calculators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 min-h-[48px]"
          />
        </div>

        {/* Calculator Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <section key={category.title} className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                {category.title}
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.calculators.map((calc) => {
                  const Icon = calc.icon;
                  return (
                    <Link
                      key={calc.name}
                      to={calc.path}
                      className="group"
                    >
                      <Card className={cn(
                        "h-full transition-all hover:shadow-lg hover:border-primary/50",
                        "touch-manipulation cursor-pointer"
                      )}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <CardTitle className="text-base md:text-lg break-words">
                                {calc.name}
                              </CardTitle>
                            </div>
                            {calc.badge && (
                              <Badge variant="secondary" className="shrink-0 text-xs">
                                {calc.badge}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-2 line-clamp-2">
                            {calc.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <Card className="p-12 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No calculators found matching "{searchQuery}"
            </p>
          </Card>
        )}
      </main>
    </AppLayout>
  );
};

export default Calculators;
