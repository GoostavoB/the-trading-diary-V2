import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { TrendingUp, Sparkles, Activity, Users } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  const { isLoading } = useTranslation();

  if (isLoading) return null;

  return (
    <section
      className="relative min-h-screen flex items-center px-4 md:px-6 pt-16 pb-24 overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Ambient blur orbs */}
      <div
        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-electric/20 blur-[120px] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full bg-apple-purple/15 blur-[120px] pointer-events-none"
        aria-hidden
      />

      <div className="container relative mx-auto max-w-7xl z-10">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          {/* LEFT — headline + CTA + stats */}
          <div className="space-y-8 animate-slide-up">
            {/* Announcement chip */}
            <div className="inline-flex">
              <span className="chip chip-electric">
                <span className="pulse-dot" />
                New · AI-powered trade analysis
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-5">
              <h1
                id="hero-title"
                className="font-display text-5xl md:text-7xl font-bold tracking-tight text-gradient-hero leading-[1.05]"
              >
                Every trade.
                <br />
                Every lesson.
                <br />
                <span className="text-gradient-electric">Every edge.</span>
              </h1>
              <p className="text-lg md:text-xl text-space-200 max-w-2xl leading-relaxed">
                Track your crypto trades, uncover hidden patterns, and turn losses into
                lessons with AI-powered insights built for serious traders.
              </p>
            </div>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => navigate("/auth")}
                className="btn-primary"
                aria-label="Start tracking your trades for free"
              >
                Start tracking — it's free
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("core-features-heading");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn-secondary"
                aria-label="See an overview of the product"
              >
                See an overview
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 pt-6">
              <div className="card-premium p-5 animate-fade-in delay-100">
                <div className="flex items-center gap-2 text-electric mb-2">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="font-num text-2xl md:text-3xl font-bold text-space-100">
                  47,238
                </div>
                <div className="text-xs text-space-300 mt-1">Trades indexed</div>
              </div>
              <div className="card-premium p-5 animate-fade-in delay-200">
                <div className="flex items-center gap-2 text-apple-green mb-2">
                  <Users className="w-4 h-4" />
                </div>
                <div className="font-num text-2xl md:text-3xl font-bold text-space-100">
                  12,491
                </div>
                <div className="text-xs text-space-300 mt-1">Active traders</div>
              </div>
              <div className="card-premium p-5 animate-fade-in delay-300">
                <div className="flex items-center gap-2 text-apple-purple mb-2">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="font-num text-2xl md:text-3xl font-bold text-space-100">
                  99.97%
                </div>
                <div className="text-xs text-space-300 mt-1">Uptime · 30d</div>
              </div>
            </div>
          </div>

          {/* RIGHT — product mockup */}
          <div className="relative animate-fade-in delay-200">
            <div className="card-premium-highlight p-6 md:p-8 animate-float">
              {/* Mockup header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs text-space-300">Portfolio value</div>
                  <div className="font-num text-3xl font-bold text-space-100 mt-1">
                    $48,219.40
                  </div>
                </div>
                <span className="chip chip-green">
                  <span className="pulse-dot" />
                  Live
                </span>
              </div>

              {/* Equity curve */}
              <svg
                viewBox="0 0 400 160"
                className="w-full h-40"
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--electric-blue))" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="hsl(var(--electric-blue))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,130 L30,120 L60,124 L90,100 L120,108 L150,84 L180,92 L210,68 L240,76 L270,52 L300,60 L330,38 L360,46 L400,22 L400,160 L0,160 Z"
                  fill="url(#equityFill)"
                />
                <path
                  d="M0,130 L30,120 L60,124 L90,100 L120,108 L150,84 L180,92 L210,68 L240,76 L270,52 L300,60 L330,38 L360,46 L400,22"
                  fill="none"
                  stroke="hsl(var(--electric-blue))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="400" cy="22" r="4" fill="hsl(var(--electric-blue))" />
              </svg>

              {/* Mini stats grid */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-space-500">
                <div>
                  <div className="text-xs text-space-300">Win rate</div>
                  <div className="font-num text-lg font-semibold text-apple-green mt-1">
                    68.4%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-space-300">Avg R</div>
                  <div className="font-num text-lg font-semibold text-space-100 mt-1">
                    +1.82
                  </div>
                </div>
                <div>
                  <div className="text-xs text-space-300">Today</div>
                  <div className="font-num text-lg font-semibold text-apple-green mt-1">
                    +$2,473
                  </div>
                </div>
              </div>
            </div>

            {/* Floating chips */}
            <div className="absolute -top-4 -right-2 md:top-4 md:-right-6 animate-float delay-200">
              <div className="chip chip-green shadow-premium-sm">
                <TrendingUp className="w-3 h-3" />
                +$2,473 today
              </div>
            </div>
            <div className="absolute -bottom-2 -left-2 md:bottom-8 md:-left-6 animate-float delay-400">
              <div className="chip chip-electric shadow-premium-sm">
                <Sparkles className="w-3 h-3" />
                68.4% win rate
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
