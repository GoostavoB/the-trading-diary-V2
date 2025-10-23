import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  content: string;
  date: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Professional Day Trader',
    avatar: '/placeholder.svg',
    rating: 5,
    content: 'The Trading Diary has completely transformed how I track my trades. The analytics features helped me identify patterns I never noticed before. My win rate has improved by 15% since I started using it!',
    date: 'March 2024',
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Swing Trader',
    avatar: '/placeholder.svg',
    rating: 5,
    content: 'Finally, a trading journal that understands what traders actually need. The risk management tools and psychology tracking features are game-changers. Highly recommend!',
    date: 'February 2024',
  },
  {
    id: '3',
    name: 'Emma Williams',
    role: 'Crypto Investor',
    avatar: '/placeholder.svg',
    rating: 5,
    content: 'The exchange integration makes importing trades effortless. I love the detailed performance reports and the AI-powered insights. Worth every penny!',
    date: 'January 2024',
  },
  {
    id: '4',
    name: 'David Rodriguez',
    role: 'Forex Trader',
    avatar: '/placeholder.svg',
    rating: 5,
    content: 'Best trading journal I\'ve used in my 10 years of trading. The mobile app is fantastic, and the community features help me learn from other successful traders.',
    date: 'March 2024',
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    role: 'Options Trader',
    avatar: '/placeholder.svg',
    rating: 4,
    content: 'Great platform with comprehensive features. The learning resources are excellent for improving trading psychology. Customer support is responsive and helpful.',
    date: 'February 2024',
  },
  {
    id: '6',
    name: 'James Kim',
    role: 'Algorithmic Trader',
    avatar: '/placeholder.svg',
    rating: 5,
    content: 'The API documentation is top-notch. I integrated my automated strategies seamlessly. The advanced analytics help me optimize my algorithms continuously.',
    date: 'January 2024',
  },
];

export default function Testimonials() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            What Our Traders Say
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful traders who have improved their performance with The Trading Diary
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">50K+</div>
            <div className="text-muted-foreground">Active Traders</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-muted-foreground">Average Rating</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">1M+</div>
            <div className="text-muted-foreground">Trades Analyzed</div>
          </Card>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={testimonial.avatar} />
                  <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>

              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>

              <p className="text-sm text-foreground leading-relaxed">
                "{testimonial.content}"
              </p>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                {testimonial.date}
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="p-8 text-center bg-primary/5">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of traders who are already improving their performance
          </p>
          <a href="/auth" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 py-2">
            Start Free Trial
          </a>
        </Card>
      </div>
    </AppLayout>
  );
}
