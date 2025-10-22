interface Exchange {
  name: string;
  logo: string;
  alt: string;
}

const exchanges: Exchange[] = [
  { name: "Binance", logo: "/exchange-logos/binance.png?v=20251022-1", alt: "Binance logo" },
  { name: "Bybit", logo: "/exchange-logos/bybit.png?v=20251022-1", alt: "Bybit logo" },
  { name: "Coinbase", logo: "/exchange-logos/coinbase.png", alt: "Coinbase logo" },
  { name: "OKX", logo: "/exchange-logos/okx.svg", alt: "OKX logo" },
  { name: "Kraken", logo: "/exchange-logos/kraken.svg", alt: "Kraken logo" },
  { name: "KuCoin", logo: "/exchange-logos/kucoin.png?v=20251022-1", alt: "KuCoin logo" },
  { name: "Gate.io", logo: "/exchange-logos/gateio.svg", alt: "Gate.io logo" },
  { name: "MEXC", logo: "/exchange-logos/mexc.png?v=20251022-1", alt: "MEXC logo" },
  { name: "Bitfinex", logo: "/exchange-logos/bitfinex.png", alt: "Bitfinex logo" },
  { name: "Bitstamp", logo: "/exchange-logos/bitstamp.png", alt: "Bitstamp logo" },
  { name: "BingX", logo: "/exchange-logos/bingx.png?v=20251022-1", alt: "BingX logo" },
];

export const ExchangeCarousel = () => {
  return (
    <div
      className="py-8"
      aria-label="Partner exchanges"
      role="region"
    >
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 max-w-4xl mx-auto">
        {exchanges.map((exchange) => (
          <img
            key={exchange.name}
            src={exchange.logo}
            alt={exchange.alt}
            className="h-8 md:h-10 w-auto object-contain shrink-0"
            loading="lazy"
            decoding="async"
            role="img"
            aria-label={exchange.alt}
          />
        ))}
      </div>
    </div>
  );
};
