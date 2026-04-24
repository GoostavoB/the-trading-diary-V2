import { useTranslation } from "@/hooks/useTranslation";
import { Zap, Clock, ShieldCheck, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "electric" | "green" | "orange" | "purple";

interface Metric {
  id: string;
  icon: LucideIcon;
  value: string;
  label: string;
  description: string;
  tone: Tone;
  bar: number;
}

export const ProofBar = () => {
  const { t } = useTranslation();

  const metrics: Metric[] = [
    {
      id: "01",
      icon: Zap,
      value: t("landing.performanceMetrics.metric1.value", "40x"),
      label: t("landing.performanceMetrics.metric1.title", "Faster uploads"),
      description: t(
        "landing.performanceMetrics.metric1.description",
        "Batch upload screenshots and process trades in seconds."
      ),
      tone: "electric",
      bar: 92,
    },
    {
      id: "02",
      icon: Clock,
      value: t("landing.performanceMetrics.metric2.value", "97%"),
      label: t("landing.performanceMetrics.metric2.title", "Time saved"),
      description: t(
        "landing.performanceMetrics.metric2.description",
        "Focus on analysis instead of manual work."
      ),
      tone: "green",
      bar: 97,
    },
    {
      id: "03",
      icon: ShieldCheck,
      value: t("landing.performanceMetrics.metric3.value", "3.4σ"),
      label: t("landing.performanceMetrics.metric3.title", "Errors caught"),
      description: t(
        "landing.performanceMetrics.metric3.description",
        "Daily review helps you detect mistakes early."
      ),
      tone: "orange",
      bar: 76,
    },
    {
      id: "04",
      icon: Target,
      value: t("landing.performanceMetrics.metric4.value", "+28%"),
      label: t("landing.performanceMetrics.metric4.title", "Better decisions"),
      description: t(
        "landing.performanceMetrics.metric4.description",
        "Structured logs and clear analytics support better choices."
      ),
      tone: "purple",
      bar: 84,
    },
  ];

  const chipClassFor = (tone: Tone) => {
    switch (tone) {
      case "green":
        return "chip chip-green";
      case "orange":
        return "chip chip-orange";
      case "purple":
        return "chip chip-purple";
      default:
        return "chip chip-electric";
    }
  };

  const barColorFor = (tone: Tone) => {
    switch (tone) {
      case "green":
        return "bg-apple-green";
      case "orange":
        return "bg-apple-orange";
      case "purple":
        return "bg-apple-purple";
      default:
        return "bg-electric";
    }
  };

  return (
    <section
      className="relative z-20 px-4 md:px-6 py-12 md:py-16"
      aria-label="Performance metrics"
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-space-100 tracking-tight">
            {t("landing.performanceMetrics.sectionTitle", "Built to make you better")}
          </h2>
          <p className="text-sm md:text-base text-space-300 mt-2">
            Real outcomes from traders using the diary daily.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className="card-premium p-5 animate-fade-in"
              >
                <div
                  className={`${chipClassFor(m.tone)} w-8 h-8 !p-0 flex items-center justify-center !rounded-lg`}
                  aria-hidden
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="font-num text-2xl md:text-3xl font-bold text-space-100 mt-4">
                  {m.value}
                </div>
                <div className="text-sm font-medium text-space-100 mt-1">
                  {m.label}
                </div>
                <div className="text-xs text-space-300 leading-relaxed mt-2">
                  {m.description}
                </div>

                {/* progress bar */}
                <div className="mt-4 h-1 bg-space-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColorFor(m.tone)} rounded-full transition-all duration-700`}
                    style={{ width: `${m.bar}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
