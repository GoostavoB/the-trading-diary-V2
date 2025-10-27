import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, BarChart3, Brain, TrendingUp, Users, Award } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Import Your Trades',
    description: 'Upload screenshots of your trades (up to 10 trades per image). Connect your exchange via API for automatic syncing. Export to CSV available.',
  },
  {
    number: '02',
    icon: BarChart3,
    title: 'Analyze Performance',
    description: 'Get instant insights into your trading performance with detailed analytics, charts, and metrics. Identify your strengths and weaknesses.',
  },
  {
    number: '03',
    icon: Brain,
    title: 'Track Psychology',
    description: 'Log your emotions and thoughts before, during, and after trades. Understand how psychology impacts your trading decisions.',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Improve Results',
    description: 'Use AI-powered insights and recommendations to refine your strategy. Set goals and track your progress over time.',
  },
  {
    number: '05',
    icon: Users,
    title: 'Learn from Community',
    description: 'Connect with other traders, share strategies, and learn from the best performers in our community leaderboard.',
  },
  {
    number: '06',
    icon: Award,
    title: 'Achieve Mastery',
    description: 'Unlock achievements, earn badges, and level up your trading skills. Become a consistent, profitable trader.',
  },
];

const features = [
  {
    title: 'Exchange Integration',
    description: 'Connect Binance, Bybit, OKX, and more for automatic trade syncing',
  },
  {
    title: 'AI-Powered Insights',
    description: 'Get personalized recommendations based on your trading patterns',
  },
  {
    title: 'Risk Management',
    description: 'Calculate position sizes and manage risk with built-in tools',
  },
  {
    title: 'Mobile Apps',
    description: 'Trade journal on the go with our iOS and Android apps',
  },
  {
    title: 'Tax Reports',
    description: 'Generate comprehensive tax reports for easy filing',
  },
  {
    title: 'Secure & Private',
    description: 'Your data is encrypted and never shared with third parties',
  },
];

export default function HowItWorks() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            How The Trading Diary Works
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your trading performance in 6 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step) => (
            <Card key={step.number} className="p-6 space-y-4 hover:shadow-lg transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary/20">
                  {step.number}
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground">
              Comprehensive tools for every aspect of trading
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 space-y-2">
                <h4 className="font-semibold">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="p-12 text-center bg-gradient-to-br from-primary/10 to-primary/5">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Trading Journey?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of traders who have improved their performance with The Trading Diary
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/auth">Start Free Trial</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/pricing">View Pricing</a>
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
