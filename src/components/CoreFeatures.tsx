import { useTranslation } from "@/hooks/useTranslation";

export const CoreFeatures = () => {
  const { t } = useTranslation();

  const features: { code: string; label: string; status: "OK" | "BETA" | "LIVE" }[] = [
    { code: "ai.extract",         label: "AI extracts for fast trade logging",     status: "OK" },
    { code: "upload.unlimited",   label: "Unlimited manual uploads",               status: "OK" },
    { code: "dedup.engine",       label: "Anti duplicate trade detection",         status: "OK" },
    { code: "screenshot.ingest",  label: "Screenshot uploads",                     status: "OK" },
    { code: "charts.advanced",    label: "Advanced charts and analytics",          status: "OK" },
    { code: "journal.emotional",  label: "Journal with emotional tracking",        status: "OK" },
    { code: "sentiment.lsr",      label: "Market sentiment with combined LSR",     status: "LIVE" },
    { code: "fee.compare",        label: "Exchange fee comparison",                status: "OK" },
    { code: "forecast.wealth",    label: "Wealth forecast",                        status: "OK" },
    { code: "risk.calc",          label: "Risk calculator",                        status: "OK" },
    { code: "insights.perf",      label: "Smart performance insights",             status: "OK" },
    { code: "history.full",       label: "Trade history",                          status: "OK" },
    { code: "tax.export",         label: "Tax report export",                      status: "BETA" },
  ];

  return (
    <section
      className="py-20 md:py-28 px-3 md:px-6"
      aria-labelledby="core-features-heading"
    >
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-cyan-term">
              core_features.md
            </span>
            <span className="status-pill cyan">[ ready ]</span>
            <div className="flex-1 border-b border-dashed border-phosphor/30" />
          </div>
          <h2
            id="core-features-heading"
            className="font-display text-3xl md:text-4xl text-phosphor glow-text tracking-tight"
          >
            &gt; MODULES /<span className="text-cyan-term glow-text-cyan"> LOADED</span>
          </h2>
          <p className="font-mono text-sm text-phosphor-dim mt-3 max-w-2xl">
            // 13/13 subsystems online. select one to drop into the dashboard.
          </p>
        </header>

        {/* Feature table */}
        <div className="term-card !p-0 overflow-hidden">
          <div className="term-header">
            <span>./modules --list</span>
            <span className="ml-auto text-phosphor-dim text-[10px]">13 rows</span>
          </div>

          <div className="divide-y divide-phosphor/15">
            {/* table head */}
            <div className="grid grid-cols-[60px_1fr_auto] md:grid-cols-[60px_220px_1fr_auto] gap-3 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-phosphor-dim bg-phosphor/5">
              <div>idx</div>
              <div className="hidden md:block">code</div>
              <div>module</div>
              <div>status</div>
            </div>

            {features.map((f, i) => {
              const idx = String(i + 1).padStart(2, "0");
              const pillClass =
                f.status === "BETA" ? "status-pill amber" :
                f.status === "LIVE" ? "status-pill cyan" :
                "status-pill";

              return (
                <div
                  key={f.code}
                  className="grid grid-cols-[60px_1fr_auto] md:grid-cols-[60px_220px_1fr_auto] gap-3 px-4 py-2.5 items-center hover:bg-phosphor/5 transition-colors"
                >
                  <div className="font-mono text-xs text-phosphor-dim">{idx}</div>
                  <div className="hidden md:block font-mono text-xs text-amber-term truncate">
                    {f.code}
                  </div>
                  <div className="font-mono text-sm text-phosphor leading-tight">
                    <span className="md:hidden text-amber-term">{f.code} </span>
                    <span className="text-phosphor-dim">// </span>
                    {f.label}
                  </div>
                  <div>
                    <span className={pillClass}>
                      {f.status === "OK" ? (
                        <>
                          <span className="pulse-dot" />
                          OK
                        </>
                      ) : f.status === "LIVE" ? (
                        <>
                          <span className="pulse-dot" />
                          LIVE
                        </>
                      ) : (
                        <>
                          <span className="pulse-dot amber" />
                          BETA
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* footer */}
          <div className="border-t border-phosphor/30 bg-phosphor/5 px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono uppercase tracking-[0.14em] text-phosphor-dim">
            <span>exit_code: 0</span>
            <span className="text-phosphor-dim">|</span>
            <span>elapsed: 0.14s</span>
            <span className="text-phosphor-dim">|</span>
            <span className="text-phosphor">all_subsystems_nominal<span className="cursor-blink" /></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoreFeatures;
