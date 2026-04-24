import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useState } from "react";

const TERMINAL_LINES: { tone: "prompt" | "ok" | "warn" | "err" | "dim"; text: string }[] = [
  { tone: "prompt", text: "./import --from=binance --last=7d" },
  { tone: "ok",     text: "✓ 47,238 trades synced" },
  { tone: "ok",     text: "✓ 142 setups classified" },
  { tone: "prompt", text: "./analyze --mode=deep" },
  { tone: "warn",   text: "⚠ 3 revenge-trade patterns detected" },
  { tone: "warn",   text: "⚠ avg hold time after loss: 0.8x avg hold after win" },
  { tone: "ok",     text: "✓ edge concentrated on: 10-14 UTC · BTC/ETH · breakout-retest" },
  { tone: "dim",    text: "// ready. awaiting operator input_" },
];

const HUD_STATS = [
  { label: "TRADES INDEXED",  value: "47,238.00", unit: "records" },
  { label: "OPERATORS LIVE",  value: "12,491",    unit: "sessions" },
  { label: "UPTIME",          value: "99.97%",    unit: "rolling 30d" },
];

const Hero = () => {
  const navigate = useNavigate();
  const { isLoading } = useTranslation();

  // Fake uptime ticker for the tmux status line
  const [uptime, setUptime] = useState(42);
  useEffect(() => {
    const id = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) return null;

  const formatUptime = (s: number) => {
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <section
      className="relative min-h-screen flex items-stretch px-3 md:px-6 pt-6 pb-16 overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* phosphor grid bg accent (layered on top of the global one) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--phosphor)/0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--phosphor)/0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* The terminal "screen" */}
      <div className="container relative mx-auto max-w-7xl z-10">
        <div className="scanlines animate-flicker border border-phosphor/40 bg-carbon/80 shadow-[0_0_40px_hsl(var(--phosphor)/0.12),inset_0_0_0_1px_hsl(var(--phosphor)/0.2)]">

          {/* ── tmux status line ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 md:px-4 py-2 bg-phosphor/10 border-b border-phosphor/30 text-[11px] tracking-[0.12em] uppercase text-phosphor-dim">
            <span className="text-phosphor glow-text">~/the-trading-diary</span>
            <span className="hidden sm:inline text-phosphor-dim">|</span>
            <span>SESSION: <span className="text-amber-term">guest@terminal</span></span>
            <span className="hidden md:inline text-phosphor-dim">|</span>
            <span className="hidden md:inline">UPTIME: <span className="text-phosphor">{formatUptime(uptime)}</span></span>
            <span className="hidden md:inline text-phosphor-dim">|</span>
            <span className="inline-flex items-center gap-2">
              <span className="pulse-dot" />
              <span>CONN: OK</span>
            </span>
            <span className="ml-auto inline-flex items-center gap-2">
              <span className="pulse-dot amber" />
              <span className="text-amber-term">MARKET: LIVE</span>
            </span>
          </div>

          {/* ── main body ── */}
          <div className="relative p-5 md:p-10 grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12">

            {/* Background scan beam */}
            <div className="scan-bar absolute inset-0 pointer-events-none" />

            {/* LEFT — headline + stream + CTA */}
            <div className="space-y-8 relative">

              {/* Status pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="status-pill">
                  <span className="pulse-dot" />
                  v2.6 // TERMINAL BUILD
                </span>
                <span className="status-pill amber">
                  <span className="pulse-dot amber" />
                  NO_CREDIT_CARD
                </span>
                <span className="status-pill cyan">CRYPTO_PERP_READY</span>
              </div>

              {/* Main headline — chromatic, flickering */}
              <div className="space-y-3">
                <h1
                  id="hero-title"
                  className="font-display text-4xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-phosphor chromatic"
                >
                  TRADE LOG:
                  <br />
                  <span className="text-amber-term glow-text-amber">ONLINE.</span>
                </h1>
                <p className="font-mono text-[13px] md:text-sm text-phosphor whitespace-nowrap overflow-hidden">
                  <span className="text-amber-term">$</span>{" "}
                  <span className="type-reveal inline-block align-middle">initialize --track-every-trade</span>
                </p>
                <p className="font-mono text-sm md:text-base text-phosphor-dim max-w-xl leading-relaxed">
                  // Built for crypto perp traders who need actual answers,<br />
                  // not prettier charts. Import, classify, expose leaks.
                </p>
              </div>

              {/* fake live terminal session */}
              <div className="term-card term-bracket relative !p-0 overflow-hidden">
                <div className="term-header">
                  <span>session.log</span>
                  <span className="ml-auto text-phosphor-dim text-[10px]">read-only</span>
                </div>
                <div className="term-stream p-4 md:p-5 space-y-1.5">
                  {TERMINAL_LINES.map((line, i) => {
                    const delay =
                      i === 0 ? "" :
                      i === 1 ? "delay-100" :
                      i === 2 ? "delay-200" :
                      i === 3 ? "delay-300" :
                      i === 4 ? "delay-400" :
                      "delay-500";
                    return (
                      <div
                        key={i}
                        className={`animate-fade-in opacity-0 ${delay}`}
                        style={{ animationDelay: `${i * 180}ms` }}
                      >
                        {line.tone === "prompt" ? (
                          <>
                            <span className="prompt" />
                            <span className="ok">{line.text}</span>
                          </>
                        ) : (
                          <span className={line.tone}>{"  "}{line.text}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/auth")}
                  className="btn-term animate-pulse-glow"
                  aria-label="Execute — boot session into The Trading Diary"
                >
                  EXECUTE
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById("core-features-heading");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="btn-term btn-term-amber"
                  aria-label="Read the feature docs"
                >
                  READ DOCS
                </button>
                <span className="font-mono text-[11px] text-phosphor-dim tracking-wider">
                  &gt; no_credit_card · free_forever_tier
                </span>
              </div>
            </div>

            {/* RIGHT — oscilloscope + HUD stats */}
            <div className="space-y-6 relative">

              {/* Oscilloscope card */}
              <div className="hud-panel hud-corners relative overflow-hidden">
                <span className="hud-c tl" />
                <span className="hud-c tr" />
                <span className="hud-c bl" />
                <span className="hud-c br" />

                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-phosphor-dim">
                    BTCUSDT.P // 15m
                  </span>
                  <span className="status-pill">
                    <span className="pulse-dot" />
                    LIVE
                  </span>
                </div>

                <svg
                  viewBox="0 0 400 140"
                  className="w-full h-32 md:h-40"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="oscFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--phosphor))" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="hsl(var(--phosphor))" stopOpacity="0" />
                    </linearGradient>
                    <filter id="oscGlow">
                      <feGaussianBlur stdDeviation="1.2" />
                    </filter>
                  </defs>
                  {/* grid */}
                  {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
                    <line
                      key={i}
                      x1="0"
                      x2="400"
                      y1={140 * y}
                      y2={140 * y}
                      stroke="hsl(var(--phosphor))"
                      strokeOpacity="0.08"
                    />
                  ))}
                  {[0.25, 0.5, 0.75].map((x, i) => (
                    <line
                      key={`v${i}`}
                      y1="0"
                      y2="140"
                      x1={400 * x}
                      x2={400 * x}
                      stroke="hsl(var(--phosphor))"
                      strokeOpacity="0.08"
                    />
                  ))}
                  {/* waveform fill */}
                  <path
                    d="M0,90 L20,85 L40,92 L60,70 L80,78 L100,60 L120,65 L140,48 L160,55 L180,38 L200,50 L220,32 L240,44 L260,28 L280,42 L300,22 L320,36 L340,18 L360,28 L380,14 L400,24 L400,140 L0,140 Z"
                    fill="url(#oscFill)"
                  />
                  {/* waveform line */}
                  <path
                    d="M0,90 L20,85 L40,92 L60,70 L80,78 L100,60 L120,65 L140,48 L160,55 L180,38 L200,50 L220,32 L240,44 L260,28 L280,42 L300,22 L320,36 L340,18 L360,28 L380,14 L400,24"
                    fill="none"
                    stroke="hsl(var(--phosphor))"
                    strokeWidth="1.5"
                    filter="url(#oscGlow)"
                  />
                  {/* latest price dot */}
                  <circle cx="400" cy="24" r="3" fill="hsl(var(--amber))" />
                  <circle cx="400" cy="24" r="7" fill="none" stroke="hsl(var(--amber))" strokeOpacity="0.6">
                    <animate attributeName="r" from="3" to="12" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                </svg>

                <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] md:text-xs font-mono uppercase tracking-[0.1em]">
                  <div>
                    <div className="text-phosphor-dim">LAST</div>
                    <div className="text-phosphor glow-text">68,412.50</div>
                  </div>
                  <div>
                    <div className="text-phosphor-dim">Δ 24H</div>
                    <div className="text-phosphor glow-text">+2.14%</div>
                  </div>
                  <div>
                    <div className="text-phosphor-dim">VOL</div>
                    <div className="text-amber-term glow-text-amber">1.24B</div>
                  </div>
                </div>
              </div>

              {/* HUD stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {HUD_STATS.map((s) => (
                  <div key={s.label} className="hud-panel hud-corners">
                    <span className="hud-c tl" />
                    <span className="hud-c tr" />
                    <span className="hud-c bl" />
                    <span className="hud-c br" />
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-phosphor-dim mb-1">
                      {s.label}
                    </div>
                    <div className="font-display text-2xl text-phosphor glow-text">
                      {s.value}
                    </div>
                    <div className="font-mono text-[10px] text-phosphor-dim mt-0.5">
                      // {s.unit}
                    </div>
                  </div>
                ))}
              </div>

              {/* ASCII art bull */}
              <div className="term-card term-bracket">
                <div className="flex items-start gap-3">
                  <pre className="font-mono text-[9px] md:text-[10px] leading-[1.1] text-phosphor glow-text whitespace-pre">
{`   /|       |\\
  /_|_______|_\\
 (   \\_o  o_/   )
  \\    (  )    /
   \\__/    \\__/
      ||  ||
      ||  ||
      ^^  ^^`}
                  </pre>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-term mb-1">
                      BULL.ASCII
                    </div>
                    <div className="font-mono text-[11px] text-phosphor-dim leading-relaxed">
                      // edge is not a vibe.<br />
                      // it is a measurement.<br />
                      // log → review → iterate.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* bottom status bar */}
          <div className="border-t border-phosphor/30 bg-phosphor/5 px-3 md:px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono uppercase tracking-[0.14em] text-phosphor-dim">
            <span>BUF: 0% used</span>
            <span className="text-phosphor-dim">|</span>
            <span>PID: 00042</span>
            <span className="text-phosphor-dim">|</span>
            <span>LAT: 12ms</span>
            <span className="text-phosphor-dim">|</span>
            <span className="text-phosphor">READY_FOR_INPUT<span className="cursor-blink" /></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
