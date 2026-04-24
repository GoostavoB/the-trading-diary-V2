import AppLayout from '@/components/layout/AppLayout';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Bug, Plus, Sparkles } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'improvement' | 'bugfix' | 'enhancement';
    description: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '2.1.0',
    date: 'March 2024',
    changes: [
      { type: 'feature', description: 'Added multi-language support (EN, ES, PT, AR, VI)' },
      { type: 'feature', description: 'Blog with educational trading articles' },
      { type: 'feature', description: 'New Advanced Analytics dashboard' },
      { type: 'enhancement', description: 'Improved mobile navigation experience' },
      { type: 'improvement', description: 'Improved performance with lazy loading and code splitting' },
    ],
  },
  {
    version: '2.0.0',
    date: 'February 2024',
    changes: [
      { type: 'feature', description: 'Complete UI redesign with modern glass morphism' },
      { type: 'feature', description: 'AI-powered trade analysis and insights' },
      { type: 'feature', description: 'Real-time Long/Short Ratio tracking' },
      { type: 'enhancement', description: 'Improved dashboard customization' },
      { type: 'bugfix', description: 'Fixed trade import issues with certain brokers' },
    ],
  },
  {
    version: '1.9.5',
    date: 'January 2024',
    changes: [
      { type: 'feature', description: 'Added A/B testing framework' },
      { type: 'feature', description: 'Introduced API documentation page' },
      { type: 'improvement', description: 'Enhanced session management' },
      { type: 'bugfix', description: 'Resolved authentication token refresh issues' },
    ],
  },
  {
    version: '1.9.0',
    date: 'December 2023',
    changes: [
      { type: 'feature', description: 'Achievement system and badges' },
      { type: 'feature', description: 'Trading lessons and educational content' },
      { type: 'feature', description: 'Economic calendar integration' },
      { type: 'improvement', description: 'Faster page load times with code splitting' },
      { type: 'bugfix', description: 'Fixed timezone issues in trade history' },
    ],
  },
  {
    version: '1.8.0',
    date: 'November 2023',
    changes: [
      { type: 'feature', description: 'Exchange API integration (Binance, Bybit, OKX)' },
      { type: 'feature', description: 'Automated trade sync' },
      { type: 'enhancement', description: 'Improved risk management calculator' },
      { type: 'improvement', description: 'Better mobile responsiveness' },
    ],
  },
];

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'feature':
      return <Plus className="w-4 h-4" />;
    case 'improvement':
      return <Zap className="w-4 h-4" />;
    case 'bugfix':
      return <Bug className="w-4 h-4" />;
    case 'enhancement':
      return <Sparkles className="w-4 h-4" />;
    default:
      return <CheckCircle className="w-4 h-4" />;
  }
};

const getChangeBadge = (type: string) => {
  const variants: Record<string, any> = {
    feature: 'default',
    improvement: 'secondary',
    bugfix: 'destructive',
    enhancement: 'outline',
  };
  return variants[type] || 'outline';
};

export default function ChangelogPage() {
  return (
    <>
      <SEO
        title={pageMeta.changelog.title}
        description={pageMeta.changelog.description}
        keywords={pageMeta.changelog.keywords}
        canonical={pageMeta.changelog.canonical}
      />
      <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Changelog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track all updates, new features, and improvements to The Trading Diary
          </p>
        </div>

        <div className="space-y-8">
          {changelog.map((entry) => (
            <PremiumCard key={entry.version} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">v{entry.version}</h2>
                  <Badge variant="outline">{entry.date}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                {entry.changes.map((change, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`mt-0.5 ${change.type === 'feature' ? 'text-primary' :
                        change.type === 'improvement' ? 'text-blue-500' :
                          change.type === 'bugfix' ? 'text-destructive' :
                            'text-purple-500'
                      }`}>
                      {getChangeIcon(change.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getChangeBadge(change.type)} className="text-xs">
                          {change.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{change.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PremiumCard>
          ))}
        </div>

        <PremiumCard className="p-6 text-center bg-primary/5 border-primary/20">
          <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
          <p className="text-muted-foreground mb-4">
            Subscribe to our newsletter to get notified about new features and updates
          </p>
        </PremiumCard>
      </div>
    </AppLayout>
    </>
  );
}
