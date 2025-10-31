import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  FileText, 
  TrendingUp, 
  Sparkles, 
  LayoutDashboard, 
  RefreshCw,
  Brain,
  X
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { GlassCard } from "@/components/ui/glass-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import badgesImg from "@/assets/showcase/features/badges.png";
import taxImg from "@/assets/showcase/features/tax-reports.png";
import analyticsImg from "@/assets/showcase/features/analytics-charts.png";
import aiUploadImg from "@/assets/showcase/features/ai-upload.png";
import accountImg from "@/assets/showcase/features/account-distribution.png";
import dashboardWidgetsImg from "@/assets/showcase/features/dashboard-widgets.png";
import checklistImg from "@/assets/showcase/features/checklist.png";
import emotionsImg from "@/assets/showcase/features/emotions.png";
import brokerSelectImg from "@/assets/showcase/features/broker-select-new.png";

const FEATURES = [
  {
    id: 'badges',
    title: 'Achievement System',
    description: 'Gamified trading milestones with unlock badges and rank progression',
    icon: Trophy,
    screenshot: badgesImg,
    details: [
      'Unlock achievements as you trade',
      'Level up your trading rank',
      'Track milestone progress',
      'Compete on leaderboards'
    ]
  },
  {
    id: 'tax',
    title: 'Tax Reports',
    description: 'Automated tax-compliant reports for Binance, Bybit, Coinbase and all other exchanges',
    icon: FileText,
    screenshot: taxImg,
    details: [
      '2025-compliant tax calculations',
      'Multi-exchange support',
      'Export to CSV/PDF',
      'Capital gains tracking'
    ]
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Long/short ratios, open interest tracking, and market sentiment analysis',
    icon: TrendingUp,
    screenshot: analyticsImg,
    details: [
      'Real-time market data',
      'Long/short ratio charts',
      'Open interest trends',
      'Custom indicators'
    ]
  },
  {
    id: 'ai-upload',
    title: 'AI Trade Upload',
    description: 'Upload trade screenshots and extract data automatically with AI',
    icon: Sparkles,
    screenshot: aiUploadImg,
    details: [
      'Screenshot OCR extraction',
      'Automatic trade parsing',
      'Instant journal entries'
    ]
  },
  {
    id: 'dashboard',
    title: 'Customizable Dashboard',
    description: 'Drag-and-drop widgets, custom layouts, and personalized views',
    icon: LayoutDashboard,
    screenshot: dashboardWidgetsImg,
    details: [
      'Drag-and-drop widgets',
      'Multiple layout presets',
      'Custom chart configurations',
      'Save favorite views'
    ]
  },
  {
    id: 'sync',
    title: 'Multi-Exchange Sync',
    description: 'Centralize all your trades and view consolidated portfolio analytics',
    icon: RefreshCw,
    screenshot: brokerSelectImg,
    details: [
      'Upload trades from any exchange',
      'AI-powered screenshot extraction',
      'Cross-exchange PnL',
      'Unified trade history'
    ]
  },
  {
    id: 'psychology',
    title: 'Psychology Tracking',
    description: 'Track emotions, mental state, and decision quality for each trade',
    icon: Brain,
    screenshot: emotionsImg,
    details: [
      'Emotion tagging per trade',
      'Mental state analysis',
      'Decision quality scoring',
      'Pattern recognition'
    ]
  }
];

export const FeatureCarousel = () => {
  const [selectedFeature, setSelectedFeature] = useState<typeof FEATURES[0] | null>(null);

  return (
    <>
      <div className="relative px-12">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <CarouselItem key={feature.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <GlassCard 
                      variant="default"
                      className="group cursor-pointer overflow-hidden h-full"
                      onClick={() => setSelectedFeature(feature)}
                    >
                      <div className="relative aspect-video overflow-hidden rounded-t-xl">
                        <img 
                          src={feature.screenshot}
                          alt={`${feature.title} - ${feature.description}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Button variant="secondary" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-base">{feature.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </GlassCard>
                  </motion.div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="glass bg-primary/20 border-primary/40 hover:bg-primary/30 hover:border-primary/60 text-primary" />
          <CarouselNext className="glass bg-primary/20 border-primary/40 hover:bg-primary/30 hover:border-primary/60 text-primary" />
        </Carousel>
      </div>

      {/* Feature Detail Modal */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-3xl glass-strong">
          {selectedFeature && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <selectedFeature.icon className="h-6 w-6 text-primary" />
                  </div>
                  {selectedFeature.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="relative rounded-xl overflow-hidden border border-border/20">
                  <img 
                    src={selectedFeature.screenshot}
                    alt={selectedFeature.title}
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="space-y-4">
                  <p className="text-muted-foreground">{selectedFeature.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Key Features:</h4>
                    <ul className="grid gap-2">
                      {selectedFeature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Try This Feature Free
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
