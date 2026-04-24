import { useTranslation } from "@/hooks/useTranslation";
import {
  Sparkles,
  Upload,
  Shield,
  Image as ImageIcon,
  LineChart,
  BookOpen,
  Activity,
  Coins,
  TrendingUp,
  Calculator,
  Lightbulb,
  History,
  FileDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: "Live" | "Beta";
}

export const CoreFeatures = () => {
  const { t } = useTranslation();

  const hero: Feature = {
    icon: Sparkles,
    title: t(
      "landing.coreFeatures.hero.title",
      "AI that reads your screenshots."
    ),
    description: t(
      "landing.coreFeatures.hero.description",
      "Drop a screenshot. The diary extracts entry, exit, size, side, and fees — then classifies the setup. No more copy-paste."
    ),
  };

  const heroBullets = [
    "Extracts trades from exchange screenshots",
    "Detects and removes duplicates automatically",
    "Learns your setup patterns over time",
  ];

  const features: Feature[] = [
    {
      icon: Upload,
      title: "Unlimited manual uploads",
      description: "Log as many trades as you need, batch or one at a time.",
    },
    {
      icon: Shield,
      title: "Anti-duplicate engine",
      description: "Never double-count a trade — even across exchanges.",
    },
    {
      icon: ImageIcon,
      title: "Screenshot ingest",
      description: "Drag, drop, done. Works with Binance, Bybit, and more.",
    },
    {
      icon: LineChart,
      title: "Advanced analytics",
      description: "Equity curves, drawdown, R-multiples, and heatmaps.",
    },
    {
      icon: BookOpen,
      title: "Emotional journal",
      description: "Tag feelings per trade and spot patterns you never noticed.",
    },
    {
      icon: Activity,
      title: "Market sentiment",
      description: "Combined Long/Short Ratio across the major exchanges.",
      status: "Live",
    },
    {
      icon: Coins,
      title: "Fee comparison",
      description: "Know exactly what each exchange is costing you.",
    },
    {
      icon: TrendingUp,
      title: "Wealth forecast",
      description: "Project your equity curve based on real performance.",
    },
    {
      icon: Calculator,
      title: "Risk calculator",
      description: "Size positions by risk %, stop distance, or leverage.",
    },
    {
      icon: Lightbulb,
      title: "Smart insights",
      description: "Automated observations about your best and worst hours.",
    },
    {
      icon: History,
      title: "Full trade history",
      description: "Every trade, forever — searchable and filterable.",
    },
    {
      icon: FileDown,
      title: "Tax export",
      description: "Clean reports ready for your accountant.",
      status: "Beta",
    },
  ];

  const HeroIcon = hero.icon;

  return (
    <section
      className="py-20 md:py-28 px-4 md:px-6"
      aria-labelledby="core-features-heading"
    >
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-12 max-w-2xl">
          <h2
            id="core-features-heading"
            className="font-display text-3xl md:text-4xl font-bold text-space-100 tracking-tight"
          >
            Everything you need.{" "}
            <span className="text-gradient-premium">Nothing you don't.</span>
          </h2>
          <p className="text-base md:text-lg text-space-300 mt-3 leading-relaxed">
            Thirteen focused tools that work together — built specifically for crypto
            perp traders.
          </p>
        </header>

        {/* Hero feature */}
        <div className="card-premium-highlight p-8 md:p-10 mb-6">
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-8 md:gap-12 items-center">
            <div className="space-y-5">
              <div
                className="chip chip-electric w-12 h-12 !p-0 flex items-center justify-center !rounded-2xl"
                aria-hidden
              >
                <HeroIcon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-space-100 tracking-tight">
                {hero.title}
              </h3>
              <p className="text-base text-space-200 leading-relaxed">
                {hero.description}
              </p>
              <ul className="space-y-2 pt-2">
                {heroBullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="chip chip-electric w-5 h-5 !p-0 flex items-center justify-center !rounded-full shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-electric" />
                    </span>
                    <span className="text-sm text-space-200">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Illustration */}
            <div className="relative">
              <div className="glass-thick p-5 rounded-ios-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="chip chip-green">
                    <span className="pulse-dot" />
                    Extracting
                  </span>
                  <span className="text-xs text-space-300">screenshot.png</span>
                </div>
                <div className="space-y-2">
                  {[
                    { k: "Asset", v: "ETH/USDT" },
                    { k: "Side", v: "Long" },
                    { k: "Entry", v: "3,412.60" },
                    { k: "Exit", v: "3,498.20" },
                    { k: "Size", v: "2.4 ETH" },
                    { k: "PnL", v: "+$205.44" },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="flex items-center justify-between py-2 border-b border-space-500/60 last:border-0"
                    >
                      <span className="text-xs text-space-300">{row.k}</span>
                      <span className="font-num text-sm font-semibold text-space-100">
                        {row.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card-premium p-5">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="chip chip-electric w-10 h-10 !p-0 flex items-center justify-center !rounded-xl"
                    aria-hidden
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {f.status && (
                    <span
                      className={`chip ${
                        f.status === "Live" ? "chip-green" : "chip-orange"
                      }`}
                    >
                      {f.status === "Live" && <span className="pulse-dot" />}
                      {f.status}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-base font-semibold text-space-100 mt-4">
                  {f.title}
                </h3>
                <p className="text-sm text-space-300 leading-relaxed mt-1.5">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CoreFeatures;
