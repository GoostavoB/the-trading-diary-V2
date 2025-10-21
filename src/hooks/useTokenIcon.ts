import { useState, useEffect } from 'react';
import { useRequestCache } from './useRequestCache';

// Map common symbols to CoinGecko IDs
const SYMBOL_TO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  MATIC: 'matic-network',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  SHIB: 'shiba-inu',
  LTC: 'litecoin',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  TRX: 'tron',
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  ARB: 'arbitrum',
  OP: 'optimism',
  NEAR: 'near',
  FTM: 'fantom',
  ALGO: 'algorand',
  VET: 'vechain',
  ICP: 'internet-computer',
  APT: 'aptos',
  SUI: 'sui',
  INJ: 'injective-protocol',
  WLD: 'worldcoin-wld',
  TAO: 'bittensor',
  AAVE: 'aave',
  STX: 'blockstack',
  FET: 'fetch-ai',
  RENDER: 'render-token',
  GRT: 'the-graph',
  IMX: 'immutable-x',
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  AXS: 'axie-infinity',
  GALA: 'gala',
  ENJ: 'enjincoin',
};

// Fallback CDN icons for major tokens
const FALLBACK_ICONS: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  TAO: 'https://assets.coingecko.com/coins/images/28452/small/ARUsPeNQ_400x400.jpeg',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  SUI: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
  AAVE: 'https://assets.coingecko.com/coins/images/12645/small/aave-token-round.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
};

// In-memory cache for token icons
const iconCache: Record<string, string> = {};

/**
 * Hook to fetch and cache a single token icon
 * @param symbol - Token symbol (e.g., 'BTC', 'ETH')
 * @returns icon URL or null
 */
export const useTokenIcon = (symbol: string | null | undefined) => {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setIconUrl(null);
      return;
    }

    const normalizedSymbol = symbol.toUpperCase().replace('USDT', '').replace('USD', '');
    
    // Check cache first
    if (iconCache[normalizedSymbol]) {
      setIconUrl(iconCache[normalizedSymbol]);
      return;
    }

    // Use fallback icon if available
    if (FALLBACK_ICONS[normalizedSymbol]) {
      const fallbackIcon = FALLBACK_ICONS[normalizedSymbol];
      iconCache[normalizedSymbol] = fallbackIcon;
      setIconUrl(fallbackIcon);
      return;
    }

    const fetchIcon = async () => {
      setLoading(true);
      try {
        const coinId = SYMBOL_TO_ID[normalizedSymbol] || normalizedSymbol.toLowerCase();
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`,
          { 
            signal: AbortSignal.timeout(3000) // 3 second timeout
          }
        );

        if (response.ok) {
          const data = await response.json();
          const icon = data.image?.small || data.image?.thumb;
          
          if (icon) {
            iconCache[normalizedSymbol] = icon;
            setIconUrl(icon);
          }
        }
      } catch (error) {
        console.debug(`Failed to fetch icon for ${normalizedSymbol}:`, error);
        // No icon available, will show fallback
      } finally {
        setLoading(false);
      }
    };

    fetchIcon();
  }, [symbol]);

  return { iconUrl, loading };
};

/**
 * Hook to fetch multiple token icons at once
 * More efficient than calling useTokenIcon multiple times
 */
export const useTokenIcons = (symbols: string[]) => {
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbols.length) {
      setLoading(false);
      return;
    }

    const fetchIcons = async () => {
      setLoading(true);
      try {
        const normalizedSymbols = symbols.map(s => 
          s.toUpperCase().replace('USDT', '').replace('USD', '')
        );

        // Get symbols that aren't cached
        const uncachedSymbols = normalizedSymbols.filter(s => !iconCache[s]);
        
        // Use cached icons and fallback icons
        const cachedIcons: Record<string, string> = {};
        normalizedSymbols.forEach(symbol => {
          if (iconCache[symbol]) {
            cachedIcons[symbol] = iconCache[symbol];
          } else if (FALLBACK_ICONS[symbol]) {
            iconCache[symbol] = FALLBACK_ICONS[symbol];
            cachedIcons[symbol] = FALLBACK_ICONS[symbol];
          }
        });

        // Filter to only truly uncached symbols (no fallback either)
        const trulyUncached = uncachedSymbols.filter(s => !FALLBACK_ICONS[s]);

        if (trulyUncached.length === 0) {
          setIcons(cachedIcons);
          setLoading(false);
          return;
        }

        // Fetch uncached icons from API
        const ids = trulyUncached
          .map(symbol => SYMBOL_TO_ID[symbol] || symbol.toLowerCase())
          .join(',');

        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
          { 
            signal: AbortSignal.timeout(5000) // 5 second timeout
          }
        );

        if (response.ok) {
          const data = await response.json();
          const newIcons: Record<string, string> = { ...cachedIcons };
          
          data.forEach((token: any) => {
            const symbol = token.symbol.toUpperCase();
            if (token.image) {
              iconCache[symbol] = token.image;
              newIcons[symbol] = token.image;
            }
          });

          setIcons(newIcons);
        } else {
          setIcons(cachedIcons);
        }
      } catch (error) {
        console.debug('Failed to fetch token icons:', error);
        // Return what we have from cache and fallbacks
        const availableIcons: Record<string, string> = {};
        symbols.forEach(s => {
          const normalized = s.toUpperCase().replace('USDT', '').replace('USD', '');
          if (iconCache[normalized]) {
            availableIcons[normalized] = iconCache[normalized];
          } else if (FALLBACK_ICONS[normalized]) {
            availableIcons[normalized] = FALLBACK_ICONS[normalized];
          }
        });
        setIcons(availableIcons);
      } finally {
        setLoading(false);
      }
    };

    fetchIcons();
  }, [symbols.join(',')]);

  return { icons, loading };
};
