import { useState } from "react";

interface ExchangeLogoProps {
  exchangeId: string;
  exchangeName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showFallback?: boolean;
}

const exchangeLogos: Record<string, { svg: string; png?: string }> = {
  binance: { svg: "/exchange-logos/binance.png?v=2" },
  bybit: { svg: "/exchange-logos/bybit.png?v=2" },
  coinbase: { svg: "/exchange-logos/coinbase.png?v=2" },
  okx: { svg: "/exchange-logos/okx.png?v=2" },
  kraken: { svg: "/exchange-logos/kraken.png?v=2" },
  kucoin: { svg: "/exchange-logos/kucoin.png?v=2" },
  gateio: { svg: "/exchange-logos/gateio.png?v=2" },
  mexc: { svg: "/exchange-logos/mexc.png?v=2" },
  bitfinex: { svg: "/exchange-logos/bitfinex.png?v=2" },
  bitstamp: { svg: "/exchange-logos/bitstamp.png?v=2" },
  bingx: { svg: "/exchange-logos/bingx.png?v=2" },
};

const sizeClasses = {
  sm: "h-5 md:h-6",
  md: "h-6 md:h-8",
  lg: "h-8 md:h-10",
};

export const ExchangeLogo = ({
  exchangeId,
  exchangeName,
  size = "md",
  className = "",
  showFallback = true,
}: ExchangeLogoProps) => {
  const [imgError, setImgError] = useState(false);
  const [usePng, setUsePng] = useState(false);

  const exchangeKey = exchangeId.toLowerCase().replace(/\./g, "");
  const logoData = exchangeLogos[exchangeKey];

  const handleError = () => {
    if (!usePng && logoData?.png) {
      // Try PNG fallback
      setUsePng(true);
    } else {
      // Show text fallback
      setImgError(true);
    }
  };

  if (imgError || !logoData) {
    return showFallback ? (
      <div
        className={`${sizeClasses[size]} w-auto px-4 py-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center ${className}`}
        aria-label={`${exchangeName} logo`}
      >
        <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent uppercase tracking-wider">
          {exchangeName.slice(0, 4)}
        </span>
      </div>
    ) : null;
  }

  const imgSrc = usePng && logoData.png ? logoData.png : logoData.svg;

  return (
    <img
      src={imgSrc}
      alt={`${exchangeName} logo`}
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
      onError={handleError}
      loading="lazy"
      decoding="async"
      style={{
        imageRendering: "-webkit-optimize-contrast",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    />
  );
};
