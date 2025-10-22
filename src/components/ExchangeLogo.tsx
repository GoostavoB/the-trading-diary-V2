import { useState } from "react";

interface ExchangeLogoProps {
  exchangeId: string;
  exchangeName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showFallback?: boolean;
}

const exchangeLogos: Record<string, { svg: string; png?: string }> = {
  binance: { svg: "/exchange-logos/binance.svg", png: "/exchange-logos/binance.png" },
  bybit: { svg: "/exchange-logos/bybit.svg", png: "/exchange-logos/bybit.png" },
  coinbase: { svg: "/exchange-logos/coinbase.svg", png: "/exchange-logos/coinbase.png" },
  okx: { svg: "/exchange-logos/okx.svg", png: "/exchange-logos/okx.png" },
  kraken: { svg: "/exchange-logos/kraken.svg", png: "/exchange-logos/kraken.png" },
  kucoin: { svg: "/exchange-logos/kucoin.svg", png: "/exchange-logos/kucoin.png" },
  gateio: { svg: "/exchange-logos/gateio.svg", png: "/exchange-logos/gateio.png" },
  mexc: { svg: "/exchange-logos/mexc.svg", png: "/exchange-logos/mexc.png" },
  bitfinex: { svg: "/exchange-logos/bitfinex.svg", png: "/exchange-logos/bitfinex.png" },
  bitstamp: { svg: "/exchange-logos/bitstamp.svg", png: "/exchange-logos/bitstamp.png" },
  bingx: { svg: "/exchange-logos/bingx.svg", png: "/exchange-logos/bingx.png" },
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
      style={{
        imageRendering: "-webkit-optimize-contrast",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    />
  );
};
