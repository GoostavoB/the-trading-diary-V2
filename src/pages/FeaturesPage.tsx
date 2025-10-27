import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, Upload, Brain, TrendingUp, Shield, Users, 
  Smartphone, Globe, Zap, FileText, Bell, Calendar,
  Target, Award, BookOpen, RefreshCw, CheckCircle, Star
} from 'lucide-react';

const features = [
  {
    category: 'Core Features',
    items: [
      {
        icon: Upload,
        title: 'Trade Import & Sync',
        description: 'Import trades via image screenshots or connect exchanges (Binance, Bybit, OKX) for automatic syncing. CSV export available.',
        badge: 'Essential',
      },
      {
        icon: BarChart3,
        title: 'Advanced Analytics',
        description: 'Comprehensive performance metrics, win rates, profit/loss tracking, and custom reports',
        badge: 'Essential',
      },
      {
        icon: Brain,
        title: 'Psychology Tracking',
        description: 'Log emotions, thoughts, and mental state to understand how psychology impacts trading',
        badge: 'Premium',
      },
      {
        icon: Shield,
        title: 'Risk Management',
        description: 'Position size calculator, risk/reward analysis, and drawdown protection tools',
        badge: 'Essential',
      },
    ],
  },
  {
    category: 'AI & Automation',
    items: [
      {
        icon: Zap,
        title: 'AI-Powered Insights',
        description: 'Get personalized trading recommendations based on your historical performance',
        badge: 'Premium',
      },
      {
        icon: TrendingUp,
        title: 'Performance Forecasting',
        description: 'Predict future performance based on current trends and trading patterns',
        badge: 'Premium',
      },
      {
        icon: Bell,
        title: 'Smart Alerts',
        description: 'Automated notifications for performance milestones, risk thresholds, and more',
        badge: 'Essential',
      },
      {
        icon: RefreshCw,
        title: 'Auto-Sync',
        description: 'Real-time trade synchronization from connected exchanges',
        badge: 'Essential',
      },
    ],
  },
  {
    category: 'Planning & Education',
    items: [
      {
        icon: Target,
        title: 'Goal Setting',
        description: 'Set and track trading goals with milestone tracking and progress visualization',
        badge: 'Essential',
      },
      {
        icon: BookOpen,
        title: 'Trading Lessons',
        description: 'Access comprehensive educational content on trading strategies and psychology',
        badge: 'Premium',
      },
      {
        icon: Calendar,
        title: 'Economic Calendar',
        description: 'Stay informed with major economic events and market-moving news',
        badge: 'Essential',
      },
      {
        icon: FileText,
        title: 'Trading Plan',
        description: 'Create and maintain a structured trading plan with checklists and rules',
        badge: 'Essential',
      },
    ],
  },
  {
    category: 'Community & Gamification',
    items: [
      {
        icon: Users,
        title: 'Social Trading',
        description: 'Share trades, strategies, and insights with the trading community',
        badge: 'Premium',
      },
      {
        icon: Award,
        title: 'Achievements System',
        description: 'Earn badges and unlock rewards as you reach trading milestones',
        badge: 'Essential',
      },
      {
        icon: Star,
        title: 'Leaderboard',
        description: 'Compete with other traders and see where you rank',
        badge: 'Premium',
      },
      {
        icon: CheckCircle,
        title: 'Challenges',
        description: 'Daily and weekly challenges to improve your trading discipline',
        badge: 'Essential',
      },
    ],
  },
  {
    category: 'Platform & Accessibility',
    items: [
      {
        icon: Smartphone,
        title: 'Mobile Apps',
        description: 'Full-featured iOS and Android apps for trading on the go',
        badge: 'Coming Soon',
      },
      {
        icon: Globe,
        title: 'Multi-Language',
        description: 'Available in English, Spanish, Portuguese, French, and German',
        badge: 'Essential',
      },
      {
        icon: FileText,
        title: 'Tax Reports',
        description: 'Generate comprehensive tax reports for easy filing',
        badge: 'Premium',
      },
      {
        icon: Shield,
        title: 'Bank-Level Security',
        description: 'End-to-end encryption and secure data storage',
        badge: 'Essential',
      },
    ],
  },
];

export default function FeaturesPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const handleStartTrial = () => {
    const authPath = currentLang === 'en' ? '/auth' : `/${currentLang}/auth`;
    navigate(authPath);
  };

  const handleComparePlans = () => {
    const pricingPath = currentLang === 'en' ? '/pricing' : `/${currentLang}/pricing`;
    navigate(pricingPath);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Everything You Need to Master Trading
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools and features designed to help you become a consistently profitable trader
          </p>
        </div>

        {/* Features by Category */}
        {features.map((category) => (
          <div key={category.category} className="space-y-6">
            <h2 className="text-3xl font-bold">{category.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.items.map((item) => (
                <Card key={item.title} className="p-6 space-y-4 hover:shadow-lg transition-all hover:scale-[1.01]">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <Badge 
                      variant={
                        item.badge === 'Premium' ? 'default' :
                        item.badge === 'Coming Soon' ? 'outline' :
                        'secondary'
                      }
                    >
                      {item.badge}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <Card className="p-12 text-center bg-gradient-to-br from-primary/10 to-primary/5">
          <h2 className="text-3xl font-bold mb-4">
            Start Using These Features Today
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Get access to all essential features with our free plan, or upgrade to Premium for advanced tools
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={handleStartTrial}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={handleComparePlans}>
              Compare Plans
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
