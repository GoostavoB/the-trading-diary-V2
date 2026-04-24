import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Expand, ArrowRight, Zap, Shield, TrendingUp, Star } from "lucide-react";
import dashboardScreenshot from "@/assets/dashboard-screenshot-new.png";
import { useState } from "react";

const STATS = [
  { value: "47,000+", label: "Trades tracked" },
  { value: "98%", label: "Uptime" },
  { value: "4.9★", label: "Rating" },
];

const BADGES = [
  { icon: Zap, text: "AI-powered analysis" },
  { icon: Shield, text: "Privacy first" },
  { icon: TrendingUp, text: "Real-time data" },
];

const Hero = () => {
  const navigate = useNavigate();
  const { t, isLoading } = useTranslation();
  const [isImageOpen, setIsImageOpen] = useState(false);

  if (isLoading) return null;

  return (
    <section
      className="relative min-h-screen flex items-center px-6 pt-24 pb-32 overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* ── Ambient orbs ── */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(36 100% 50% / 0.07) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(210 90% 58% / 0.06) 0%, transparent 70%)' }} />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, hsl(142 70% 50% / 0.03) 0%, transparent 70%)' }} />

      {/* ── Main grid ── */}
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT — Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
                bg-primary/10 border border-primary/25 text-primary
                shadow-[0_0_20px_-4px_hsl(36_100%_50%/0.3)]">
                <Star className="h-3 w-3 fill-primary" />
                The #1 Crypto Trading Journal
                <span className="h-1 w-1 rounded-full bg-primary/60" />
                Free to start
              </span>
            </motion.div>

            {/* Headline */}
            <div className="space-y-2">
              <h1
                id="hero-title"
                className="text-[clamp(40px,5.5vw,64px)] font-black leading-[1.05] tracking-tight"
              >
                <span className="text-gradient-white">
                  {t('landing.hero.mainTitle', 'Track Every Trade.')}
                </span>
              </h1>
              <h1
                className="text-[clamp(40px,5.5vw,64px)] font-black leading-[1.05] tracking-tight"
              >
                <span className="text-gradient-primary">
                  Grow Every Day.
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              {t('landing.hero.subtitle',
                'AI-powered crypto trading journal. Track, analyze, and improve every trade with real data — not guesswork.'
              )}
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-2">
              {BADGES.map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg
                  text-xs font-medium text-muted-foreground
                  bg-white/[0.04] border border-white/8 backdrop-blur-sm">
                  <Icon className="h-3 w-3 text-primary/70" />
                  {text}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="group relative h-13 px-8 text-base font-bold rounded-xl overflow-hidden
                  bg-primary hover:bg-primary/90 transition-all duration-300
                  shadow-[0_0_30px_-6px_hsl(36_100%_50%/0.5)]
                  hover:shadow-[0_0_40px_-4px_hsl(36_100%_50%/0.7)]"
                aria-label="Start using The Trading Diary for free"
              >
                {/* shine sweep */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  transition-transform duration-700 ease-in-out pointer-events-none" />
                {t('landing.hero.ctaPrimary', 'Get Started Free')}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <span className="text-xs text-muted-foreground/60">
                No credit card · Free forever plan
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 pt-2 border-t border-white/8">
              {STATS.map(({ value, label }, i) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xl font-black text-gradient-primary">{value}</span>
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Glow behind the mockup */}
            <div className="absolute -inset-6 rounded-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, hsl(36 100% 50% / 0.12) 0%, transparent 70%)' }} />

            {/* Browser frame */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl
              border border-white/12
              shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)]">
              {/* Browser chrome */}
              <div className="bg-[hsl(220_15%_9%)] px-4 py-3 flex items-center gap-2 border-b border-white/8">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                </div>
                <div className="flex-1 mx-4 bg-white/5 border border-white/8 rounded-md px-3 py-1 text-xs text-muted-foreground/60 font-mono">
                  🔒 thetradingdiary.com/dashboard
                </div>
              </div>

              {/* Dashboard screenshot */}
              <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                <DialogTrigger asChild>
                  <button
                    className="aspect-[16/10] bg-[hsl(220_15%_6%)] relative overflow-hidden cursor-pointer group w-full
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="View full dashboard screenshot"
                  >
                    <img
                      src={dashboardScreenshot}
                      alt="Trading Dashboard showing real-time analytics, win rate, ROI, and capital growth charts"
                      className="w-full h-full object-contain object-center"
                      width={1920}
                      height={1200}
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="p-4 rounded-full bg-primary/90 backdrop-blur-sm shadow-lg">
                        <Expand className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                      </div>
                    </div>
                    {/* Bottom fade */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[hsl(220_15%_6%)] to-transparent pointer-events-none" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
                  <div className="relative w-full h-full flex items-center justify-center bg-background/95 backdrop-blur-xl p-4">
                    <img
                      src={dashboardScreenshot}
                      alt="Full Trading Dashboard"
                      className="max-w-full max-h-[90vh] object-contain rounded-lg"
                      width={1920}
                      height={1200}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute -bottom-4 -left-4 hidden lg:block"
            >
              <div className="px-4 py-3 rounded-xl border border-white/12 backdrop-blur-xl
                bg-card/90 shadow-xl space-y-0.5">
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
                  Win Rate
                </div>
                <div className="text-2xl font-black text-gradient-green">68.4%</div>
                <div className="text-[10px] text-emerald-400 font-semibold">▲ +3.2% this month</div>
              </div>
            </motion.div>

            {/* Floating ROI card */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="absolute -top-4 -right-4 hidden lg:block"
            >
              <div className="px-4 py-3 rounded-xl border border-primary/20 backdrop-blur-xl
                bg-card/90 shadow-xl
                shadow-[0_0_20px_-4px_hsl(36_100%_50%/0.2)] space-y-0.5">
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
                  Total ROI
                </div>
                <div className="text-2xl font-black text-gradient-primary">+142%</div>
                <div className="text-[10px] text-primary/80 font-semibold">Last 90 days</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
