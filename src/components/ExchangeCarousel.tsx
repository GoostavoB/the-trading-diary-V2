interface Exchange {
  name: string;
  logo: string;
  alt: string;
  size: string;
}

const exchanges: Exchange[] = [
  { name: "Binance", logo: "/exchange-logos/binance.png?v=2", alt: "Binance logo", size: "h-11 md:h-12" },
  { name: "Bybit", logo: "/exchange-logos/bybit.png?v=2", alt: "Bybit logo", size: "h-8 md:h-10" },
  { name: "Coinbase", logo: "/exchange-logos/coinbase.png?v=2", alt: "Coinbase logo", size: "h-8 md:h-10" },
  { name: "OKX", logo: "/exchange-logos/okx.png?v=2", alt: "OKX logo", size: "h-8 md:h-10" },
  { name: "Kraken", logo: "/exchange-logos/kraken.png?v=2", alt: "Kraken logo", size: "h-7 md:h-8" },
  { name: "KuCoin", logo: "/exchange-logos/kucoin.png?v=2", alt: "KuCoin logo", size: "h-9 md:h-11" },
  { name: "Gate.io", logo: "/exchange-logos/gateio.png?v=2", alt: "Gate.io logo", size: "h-8 md:h-10" },
  { name: "MEXC", logo: "/exchange-logos/mexc.png?v=2", alt: "MEXC logo", size: "h-7 md:h-8" },
  { name: "Bitfinex", logo: "/exchange-logos/bitfinex.png?v=2", alt: "Bitfinex logo", size: "h-6 md:h-7" },
  { name: "Bitstamp", logo: "/exchange-logos/bitstamp.png?v=2", alt: "Bitstamp logo", size: "h-9 md:h-10" },
  { name: "BingX", logo: "/exchange-logos/bingx.png?v=2", alt: "BingX logo", size: "h-10 md:h-12" },
];

export const ExchangeCarousel = () => {
  return (
    <div
      className="py-8"
      aria-label="Partner exchanges"
      role="region"
    >
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* First row - 4 logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 md:gap-x-12 items-center justify-items-center">
          {exchanges.slice(0, 4).map((exchange) => (
            <div 
              key={exchange.name}
              className="p-3 rounded-lg bg-background/50 dark:bg-background/30 border border-primary/10"
            >
              <img
                src={exchange.logo}
                alt={exchange.alt}
                className={`${exchange.size} w-auto object-contain shrink-0`}
                loading="lazy"
                decoding="async"
                role="img"
                aria-label={exchange.alt}
              />
            </div>
          ))}
        </div>
        
        {/* Second row - 4 logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 md:gap-x-12 items-center justify-items-center">
          {exchanges.slice(4, 8).map((exchange) => (
            <div 
              key={exchange.name}
              className="p-3 rounded-lg bg-background/50 dark:bg-background/30 border border-primary/10"
            >
              <img
                src={exchange.logo}
                alt={exchange.alt}
                className={`${exchange.size} w-auto object-contain shrink-0`}
                loading="lazy"
                decoding="async"
                role="img"
                aria-label={exchange.alt}
              />
            </div>
          ))}
        </div>
        
        {/* Third row - 3 logos centered */}
        <div className="flex justify-center gap-x-8 md:gap-x-12 items-center flex-wrap gap-y-6">
          {exchanges.slice(8).map((exchange) => (
            <div 
              key={exchange.name}
              className="p-3 rounded-lg bg-background/50 dark:bg-background/30 border border-primary/10"
            >
              <img
                src={exchange.logo}
                alt={exchange.alt}
                className={`${exchange.size} w-auto object-contain shrink-0`}
                loading="lazy"
                decoding="async"
                role="img"
                aria-label={exchange.alt}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
