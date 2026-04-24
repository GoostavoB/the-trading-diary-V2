import { useTranslation } from "@/hooks/useTranslation";
import { TrendingDown, Brain, Target, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Benefit {
  id: string;
  icon: LucideIcon;
  chipClass: string;
  title: string;
  description: string;
  tag: string;
}

export const WhyImprove = () => {
  const { t } = useTranslation();

  const benefits: Benefit[] = [
    {
      id: "01",
      icon: TrendingDown,
      chipClass: "chip chip-electric",
      title: t("landing.whyImprove.benefit1.title", "Reduce repeated errors"),
      description: t(
        "landing.whyImprove.benefit1.description",
        "Tag mistakes and watch them decline over time."
      ),
      tag: "Tracked",
    },
    {
      id: "02",
      icon: Brain,
      chipClass: "chip chip-purple",
      title: t("landing.whyImprove.benefit2.title", "Make calmer decisions"),
      description: t(
        "landing.whyImprove.benefit2.description",
        "Track emotional trades and improve control."
      ),
      tag: "Stable",
    },
    {
      id: "03",
      icon: Target,
      chipClass: "chip chip-green",
      title: t("landing.whyImprove.benefit3.title", "Build skill through daily review"),
      description: t(
        "landing.whyImprove.benefit3.description",
        "See what works and refine your process."
      ),
      tag: "Active",
    },
    {
      id: "04",
      icon: Eye,
      chipClass: "chip chip-orange",
      title: t("landing.whyImprove.benefit4.title", "Find patterns faster"),
      description: t(
        "landing.whyImprove.benefit4.description",
        "Spot changes in setups, conditions, and timing."
      ),
      tag: "Signal",
    },
  ];

  return (
    <section
      className="py-20 md:py-28 px-4 md:px-6"
      aria-labelledby="why-improve-heading"
    >
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-12 max-w-2xl">
          <h2
            id="why-improve-heading"
            className="font-display text-3xl md:text-4xl font-bold text-space-100 tracking-tight"
          >
            A simple system.{" "}
            <span className="text-gradient-electric">Better decisions.</span>
          </h2>
          <p className="text-base md:text-lg text-space-300 mt-3 leading-relaxed">
            Four feedback loops that compound over time — with zero guesswork.
          </p>
        </header>

        {/* Benefits grid */}
        <div className="grid md:grid-cols-2 gap-4" role="list">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                role="listitem"
                className="card-premium p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`${b.chipClass} w-10 h-10 !p-0 flex items-center justify-center !rounded-xl shrink-0`}
                    aria-hidden
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-lg font-semibold text-space-100 leading-snug">
                        {b.title}
                      </h3>
                      <span className="chip shrink-0 hidden sm:inline-flex">
                        {b.tag}
                      </span>
                    </div>
                    <p className="text-sm text-space-300 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyImprove;
