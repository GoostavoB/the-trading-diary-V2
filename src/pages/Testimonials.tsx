import AppLayout from '@/components/layout/AppLayout';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { MessageSquareQuote, ExternalLink, Star } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { Button } from '@/components/ui/button';

export default function Testimonials() {
  return (
    <>
      <SEO
        title={pageMeta.testimonials.title}
        description={pageMeta.testimonials.description}
        keywords={pageMeta.testimonials.keywords}
        canonical={pageMeta.testimonials.canonical}
      />
      <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">

          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              What Traders Are Saying
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real feedback from traders who use The Trading Diary every day.
            </p>
          </div>

          {/* Review Platforms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PremiumCard className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00b67a]/10 flex items-center justify-center">
                  <Star className="h-5 w-5 fill-[#00b67a] text-[#00b67a]" />
                </div>
                <div>
                  <div className="font-semibold">Trustpilot</div>
                  <div className="text-sm text-muted-foreground">Independent verified reviews</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                We're building our review profile on Trustpilot. If you've used The Trading Diary, your honest review helps other traders find us.
              </p>
              <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                <a href="https://www.trustpilot.com/review/thetradingdiary.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  View on Trustpilot
                </a>
              </Button>
            </PremiumCard>

            <PremiumCard className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquareQuote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Share Your Experience</div>
                  <div className="text-sm text-muted-foreground">Help other traders decide</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Have feedback about The Trading Diary? We'd love to hear what's working well and what we can improve.
              </p>
              <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                <a href="/contact">
                  Send Feedback
                </a>
              </Button>
            </PremiumCard>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">What traders use it for</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Reviewing mistakes', desc: 'Identifying recurring errors to stop repeating them.' },
                { title: 'Tracking performance', desc: 'Win rate, profit factor, and R:R over time.' },
                { title: 'Managing psychology', desc: 'Logging emotions and seeing their impact on results.' },
                { title: 'Uploading screenshots', desc: 'AI extracts trade data from exchange screenshots.' },
                { title: 'Setting goals', desc: 'Monthly targets with progress tracking.' },
                { title: 'Risk calculations', desc: 'Stop loss, leverage, and position size calculators.' },
              ].map((item) => (
                <PremiumCard key={item.title} className="p-4 space-y-1.5">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </PremiumCard>
              ))}
            </div>
          </div>

          {/* CTA */}
          <PremiumCard className="p-8 text-center bg-primary/5 border-primary/20 space-y-4">
            <h2 className="text-2xl font-bold">Try it free, no credit card needed</h2>
            <p className="text-muted-foreground">
              Start tracking your trades and see what patterns emerge in your own data.
            </p>
            <Button size="lg" asChild>
              <a href="/auth">Get Started Free</a>
            </Button>
          </PremiumCard>

        </div>
      </div>
      </AppLayout>
    </>
  );
}
