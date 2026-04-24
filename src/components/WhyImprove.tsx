import { useTranslation } from "@/hooks/useTranslation";

export const WhyImprove = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      id: "01",
      glyph: "[>]",
      title: t("landing.whyImprove.benefit1.title", "You reduce repeated errors"),
      description: t("landing.whyImprove.benefit1.description", "Tag mistakes and watch them decline over time."),
      status: "TRACKED",
    },
    {
      id: "02",
      glyph: "[~]",
      title: t("landing.whyImprove.benefit2.title", "You make calmer decisions"),
      description: t("landing.whyImprove.benefit2.description", "Track emotional trades and improve control."),
      status: "STABLE",
    },
    {
      id: "03",
      glyph: "[+]",
      title: t("landing.whyImprove.benefit3.title", "You build skill through daily review"),
      description: t("landing.whyImprove.benefit3.description", "See what works and refine your process."),
      status: "ACTIVE",
    },
    {
      id: "04",
      glyph: "[#]",
      title: t("landing.whyImprove.benefit4.title", "You find patterns faster"),
      description: t("landing.whyImprove.benefit4.description", "Spot changes in setups, conditions, and timing."),
      status: "SIGNAL",
    },
  ];

  return (
    <section
      className="py-20 md:py-28 px-3 md:px-6"
      aria-labelledby="why-improve-heading"
    >
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-amber-term">
              why_improve.md
            </span>
            <span className="status-pill amber">[ ready ]</span>
            <div className="flex-1 border-b border-dashed border-phosphor/30" />
          </div>
          <h2
            id="why-improve-heading"
            className="font-display text-3xl md:text-4xl text-phosphor glow-text tracking-tight"
          >
            &gt; A SIMPLE SYSTEM. <span className="text-amber-term glow-text-amber">BETTER DECISIONS.</span>
          </h2>
          <p className="font-mono text-sm text-phosphor-dim mt-3 max-w-2xl">
            // four feedback loops. compounding output. zero guesswork.
          </p>
        </header>

        {/* Benefits list */}
        <div className="grid md:grid-cols-2 gap-4" role="list">
          {benefits.map((b) => (
            <div
              key={b.id}
              role="listitem"
              className="term-card term-bracket group relative"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="font-mono text-amber-term glow-text-amber text-lg leading-none">
                    {b.glyph}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.14em] text-phosphor-dim mt-2">
                    {b.id}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-base md:text-lg text-phosphor tracking-tight leading-snug uppercase">
                      {b.title}
                    </h3>
                    <span className="status-pill shrink-0 hidden sm:inline-flex">{b.status}</span>
                  </div>
                  <p className="font-mono text-sm text-phosphor-dim leading-relaxed">
                    &gt; {b.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyImprove;
