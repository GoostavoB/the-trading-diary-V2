import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { Badge } from '@/components/ui/badge';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { BookOpen, Clock, Lock, ChevronRight, Sparkles } from 'lucide-react';

const upcomingLessons = [
  {
    id: '1',
    title: 'Introduction to Trading',
    description: 'Learn the basics of trading, market terminology, and fundamental concepts every trader should know.',
    duration: '15 min',
    difficulty: 'Beginner' as const,
    category: 'Basics',
  },
  {
    id: '2',
    title: 'Understanding Risk Management',
    description: 'Master position sizing, stop losses, and risk-reward ratios to protect your capital.',
    duration: '20 min',
    difficulty: 'Beginner' as const,
    category: 'Risk Management',
  },
  {
    id: '3',
    title: 'Technical Analysis Fundamentals',
    description: 'Learn to read charts, identify trends, and use technical indicators to find entries.',
    duration: '30 min',
    difficulty: 'Intermediate' as const,
    category: 'Technical Analysis',
  },
  {
    id: '4',
    title: 'Trading Psychology',
    description: 'Understand emotional control, discipline, and the mindset behind consistent trading results.',
    duration: '25 min',
    difficulty: 'Intermediate' as const,
    category: 'Psychology',
  },
  {
    id: '5',
    title: 'Advanced Chart Patterns',
    description: 'Master complex chart patterns and price action strategies used by professional traders.',
    duration: '40 min',
    difficulty: 'Advanced' as const,
    category: 'Technical Analysis',
  },
];

const difficultyColor = {
  Beginner: 'bg-success/10 text-success border-success/20',
  Intermediate: 'bg-warning/10 text-warning border-warning/20',
  Advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Learn() {
  return (
    <>
      <SEO
        title={pageMeta.learn.title}
        description={pageMeta.learn.description}
        keywords={pageMeta.learn.keywords}
        canonical={pageMeta.learn.canonical}
        noindex={true}
      />

      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Learn Trading</h1>
              <Badge variant="secondary" className="gap-1.5 text-xs font-semibold">
                <Sparkles className="h-3 w-3" />
                Coming Soon
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Structured lessons designed to sharpen your trading skills — from basics to advanced strategies. Currently in development.
            </p>
          </div>

          {/* Coming Soon Banner */}
          <PremiumCard className="p-5 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Interactive lessons are on the way</p>
                <p className="text-sm text-muted-foreground">
                  Each lesson will include videos, quizzes, and practical exercises tied directly to your own trading data.
                  You'll be notified as soon as the first lessons go live.
                </p>
              </div>
            </div>
          </PremiumCard>

          {/* Lesson Previews */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Preview — Upcoming Lessons</h2>
            <div className="grid gap-3">
              {upcomingLessons.map((lesson) => (
                <PremiumCard
                  key={lesson.id}
                  className="p-4 flex items-center gap-4 opacity-70 cursor-not-allowed select-none"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">{lesson.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${difficultyColor[lesson.difficulty]}`}
                      >
                        {lesson.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{lesson.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {lesson.duration}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </PremiumCard>
              ))}
            </div>
          </div>

        </div>
      </AppLayout>
    </>
  );
}
