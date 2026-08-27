/**
 * ExchangeLogoChip
 * Theme-safe exchange mark: rounded square with a translucent brand-colored
 * background and the exchange initials in the solid brand color on top.
 * Works identically in light and dark mode (no per-theme logo variants).
 */

interface ExchangeLogoChipProps {
  exchangeId: string;
  exchangeName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Official-ish brand colors, as `r g b` so we can control alpha per layer. */
const brandColors: Record<string, string> = {
  binance: "240 185 11",
  bybit: "247 164 0",
  coinbase: "0 82 255",
  okx: "20 20 20",
  kraken: "91 53 205",
  kucoin: "35 175 154",
  gateio: "44 96 246",
  mexc: "0 179 140",
  bitfinex: "22 179 100",
  bitstamp: "0 143 205",
  bingx: "42 82 255",
};

const sizeClasses = {
  sm: { box: "h-8 w-8 rounded-lg", text: "text-[10px]" },
  md: { box: "h-10 w-10 rounded-xl", text: "text-xs" },
  lg: { box: "h-12 w-12 rounded-2xl", text: "text-sm" },
};

const initialsOf = (name: string) =>
  name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();

export const ExchangeLogoChip = ({
  exchangeId,
  exchangeName,
  size = "md",
  className = "",
}: ExchangeLogoChipProps) => {
  const key = exchangeId.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Fall back to the app accent (indigo) when the brand is unknown.
  const rgb = brandColors[key] ?? "99 102 241";
  const s = sizeClasses[size];

  return (
    <div
      className={`${s.box} shrink-0 flex items-center justify-center font-semibold tracking-tight ${s.text} ${className}`}
      style={{
        backgroundColor: `rgb(${rgb} / 0.16)`,
        border: `1px solid rgb(${rgb} / 0.3)`,
        color: `rgb(${rgb})`,
      }}
      role="img"
      aria-label={`${exchangeName} logo`}
    >
      <span className="drop-shadow-[0_1px_0_rgba(0,0,0,0.15)]">
        {initialsOf(exchangeName)}
      </span>
    </div>
  );
};
