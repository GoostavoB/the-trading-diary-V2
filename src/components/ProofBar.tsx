import { useTranslation } from "@/hooks/useTranslation";

export const ProofBar = () => {
  const { t } = useTranslation();

  const metrics = [
    {
      id: "01",
      value: t("landing.performanceMetrics.metric1.value", "40x"),
      label: t("landing.performanceMetrics.metric1.title", "Upload 40x Faster"),
      description: t(
        "landing.performanceMetrics.metric1.description",
        "Batch upload screenshots and process trades in seconds."
      ),
      tone: "phosphor" as const,
      bar: 92,
    },
    {
      id: "02",
      value: t("landing.performanceMetrics.metric2.value", "97%"),
      label: t("landing.performanceMetrics.metric2.title", "Time Saved"),
      description: t(
        "landing.performanceMetrics.metric2.description",
        "Focus on analysis instead of manual work."
      ),
      tone: "amber" as const,
      bar: 97,
    },
    {
      id: "03",
      value: t("landing.performanceMetrics.metric3.value", "+3.4σ"),
      label: t("landing.performanceMetrics.metric3.title", "Errors Caught"),
      description: t(
        "landing.performanceMetrics.metric3.description",
        "Daily review helps you detect mistakes early."
      ),
      tone: "danger" as const,
      bar: 76,
    },
    {
      id: "04",
      value: t("landing.performanceMetrics.metric4.value", "↑ 28%"),
      label: t("landing.performanceMetrics.metric4.title", "Decision Accuracy"),
      description: t(
        "landing.performanceMetrics.metric4.description",
        "Structured logs and clear analytics support better choices."
      ),
      tone: "cyan" as const,
      bar: 84,
    },
  ];

  return (
    <section
      className="relative -mt-10 z-20 px-3 md:px-6 py-10"
      aria-label="Performance metrics"
    >
      <div className="container mx-auto max-w-7xl">
        {/* section header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-phosphor/30 pb-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-phosphor-dim">
              // diagnostics.module
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-phosphor glow-text uppercase tracking-tight">
              {t("landing.performanceMetrics.sectionTitle", "PERFORMANCE/READOUT")}
            </h2>
          </div>
          <span className="status-pill cyan">
            <span className="pulse-dot" />
            stream.stable
          </span>
        </div>

        {/* 4 HUD panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => {
            const toneText =
              m.tone === "amber" ? "text-amber-term glow-text-amber" :
              m.tone === "danger" ? "text-danger glow-text-danger" :
              m.tone === "cyan" ? "text-cyan-term glow-text-cyan" :
              "text-phosphor glow-text";

            const panelClass =
              m.tone === "amber" ? "hud-panel hud-panel-amber" :
              m.tone === "danger" ? "hud-panel hud-panel-danger" :
              "hud-panel";

            const barColor =
              m.tone === "amber" ? "hsl(var(--amber))" :
              m.tone === "danger" ? "hsl(var(--danger))" :
              m.tone === "cyan" ? "hsl(var(--cyan-term))" :
              "hsl(var(--phosphor))";

            return (
              <div key={m.id} className={`${panelClass} hud-corners group relative animate-fade-in`}>
                <span className="hud-c tl" />
                <span className="hud-c tr" />
                <span className="hud-c bl" />
                <span className="hud-c br" />

                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-[0.14em] text-phosphor-dim uppercase">
                    METRIC_{m.id}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-phosphor-dim uppercase">
                    [ OK ]
                  </span>
                </div>

                <div className={`font-display text-4xl md:text-5xl ${toneText} leading-none`}>
                  {m.value}
                </div>

                <div className="font-mono text-xs text-phosphor uppercase tracking-[0.08em] mt-3">
                  {m.label}
                </div>
                <div className="font-mono text-[11px] text-phosphor-dim leading-relaxed mt-2">
                  // {m.description}
                </div>

                {/* ASCII progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[9px] font-mono text-phosphor-dim uppercase tracking-[0.12em] mb-1">
                    <span>load</span>
                    <span>{m.bar}%</span>
                  </div>
                  <div className="h-1 w-full bg-phosphor/10 relative overflow-hidden">
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${m.bar}%`, background: barColor, boxShadow: `0 0 8px ${barColor}` }}
                    />
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
