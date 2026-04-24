import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { LessonCard } from '@/components/educational/LessonCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

// Mock lessons data
const lessons = [
  {
    id: '1',
    title: 'Introduction to Trading',
    description: 'Learn the basics of trading, market terminology, and fundamental concepts.',
    duration: '15 min',
    difficulty: 'beginner' as const,
    progress: 0,
    completed: false,
    locked: false,
    category: 'Basics',
  },
  {
    id: '2',
    title: 'Understanding Risk Management',
    description: 'Master position sizing, stop losses, and risk-reward ratios.',
    duration: '20 min',
    difficulty: 'beginner' as const,
    progress: 60,
    completed: false,
    locked: false,
    category: 'Risk Management',
  },
  {
    id: '3',
    title: 'Technical Analysis Fundamentals',
    description: 'Learn to read charts, identify trends, and use technical indicators.',
    duration: '30 min',
    difficulty: 'intermediate' as const,
    progress: 0,
    completed: false,
    locked: false,
    category: 'Technical Analysis',
  },
  {
    id: '4',
    title: 'Trading Psychology',
    description: 'Understand emotional control, discipline, and mindset for successful trading.',
    duration: '25 min',
    difficulty: 'intermediate' as const,
    progress: 100,
    completed: true,
    locked: false,
    category: 'Psychology',
  },
  {
    id: '5',
    title: 'Advanced Chart Patterns',
    description: 'Master complex chart patterns and price action strategies.',
    duration: '40 min',
    difficulty: 'advanced' as const,
    progress: 0,
    completed: false,
    locked: true,
    category: 'Technical Analysis',
  },
];

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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Learn Trading</h1>
            <p className="text-muted-foreground">
              Master trading with comprehensive lessons tailored to your level
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search lessons..."
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Lessons</TabsTrigger>
              <TabsTrigger value="beginner">Beginner</TabsTrigger>
              <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="grid gap-4 md:grid-cols-2 mt-6">
              {lessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </TabsContent>

            <TabsContent value="beginner" className="grid gap-4 md:grid-cols-2 mt-6">
              {lessons.filter(l => l.difficulty === 'beginner').map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </TabsContent>

            <TabsContent value="intermediate" className="grid gap-4 md:grid-cols-2 mt-6">
              {lessons.filter(l => l.difficulty === 'intermediate').map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </TabsContent>

            <TabsContent value="advanced" className="grid gap-4 md:grid-cols-2 mt-6">
              {lessons.filter(l => l.difficulty === 'advanced').map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </>
  );
}
