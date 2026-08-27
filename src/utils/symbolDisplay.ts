/**
 * Decoder for BingX synthetic tickers (CFD-style symbols).
 *
 * BingX exposes non-crypto instruments (commodities, indices, stocks, forex)
 * through synthetic tickers with an "NC" prefix, e.g.:
 *   NCCOXAG2USD/USDT:USDT      -> Silver (XAG)
 *   NCCOGOLD2USD               -> Gold (XAU)
 *   NCSINIKKEI2252USD          -> Nikkei 225
 *   NCSINASDAQ1002USD          -> Nasdaq 100
 *   NCFXUSD2CAD                -> USD/CAD
 *   NCSKMETA2USD               -> META (stock)
 *
 * Pattern: NC + category (CO=commodity, SI=stock index, SK=stock, FX=forex)
 *          + asset code + optional "2USD" + settlement pair.
 *
 * The decoding is rule-based (not a fixed hardcoded list) so new instruments
 * following the same pattern are handled automatically. A small alias map only
 * prettifies well-known codes; unknown ones fall back to the raw code.
 */

export interface DecodedSymbol {
  /** Friendly display name, e.g. "Silver (XAG)" */
  label: string;
  /** Original technical symbol, kept for tooltips/legends */
  raw: string;
  /** Category when recognised */
  category?: 'commodity' | 'index' | 'stock' | 'forex' | 'crypto';
  /** True when the symbol was decoded from a synthetic BingX ticker */
  decoded: boolean;
}

const COMMODITY_ALIASES: Record<string, string> = {
  XAG: 'Silver (XAG)',
  SILVER: 'Silver (XAG)',
  XAU: 'Gold (XAU)',
  GOLD: 'Gold (XAU)',
  XPT: 'Platinum (XPT)',
  XPD: 'Palladium (XPD)',
  WTI: 'Crude Oil (WTI)',
  OIL: 'Crude Oil',
  BRENT: 'Brent Crude',
  NGAS: 'Natural Gas',
  COPPER: 'Copper',
};

const INDEX_ALIASES: Record<string, string> = {
  NIKKEI225: 'Nikkei 225',
  NASDAQ100: 'Nasdaq 100',
  SP500: 'S&P 500',
  SPX500: 'S&P 500',
  DOW30: 'Dow Jones 30',
  DAX40: 'DAX 40',
  FTSE100: 'FTSE 100',
  HSI: 'Hang Seng',
  US30: 'Dow Jones 30',
  US500: 'S&P 500',
  RUSSELL2000: 'Russell 2000',
};

/** Splits a trailing digit group off an index code: "NIKKEI225" stays, "NASDAQ100" stays. */
function prettifyIndex(code: string): string {
  if (INDEX_ALIASES[code]) return INDEX_ALIASES[code];
  const match = code.match(/^([A-Z]+)(\d+)$/);
  if (match) return `${match[1].charAt(0)}${match[1].slice(1).toLowerCase()} ${match[2]}`;
  return code;
}

/** Strips the ccxt settlement suffix: "XXX/USDT:USDT" -> "XXX" */
function stripPair(symbol: string): { base: string; suffix: string } {
  const slash = symbol.indexOf('/');
  if (slash === -1) return { base: symbol, suffix: '' };
  return { base: symbol.slice(0, slash), suffix: symbol.slice(slash) };
}

export function decodeSymbol(symbol?: string | null): DecodedSymbol {
  const raw = (symbol ?? '').trim();
  if (!raw) return { label: '—', raw: '', decoded: false };

  const { base } = stripPair(raw.toUpperCase());

  if (!base.startsWith('NC')) {
    return { label: raw, raw, decoded: false };
  }

  const body = base.slice(2);
  const category = body.slice(0, 2);
  let code = body.slice(2);

  // Forex: NCFXUSD2CAD -> USD/CAD
  if (category === 'FX') {
    const fx = code.match(/^([A-Z]{3})2([A-Z]{3})$/);
    if (fx) {
      return { label: `${fx[1]}/${fx[2]}`, raw, category: 'forex', decoded: true };
    }
    return { label: code || raw, raw, category: 'forex', decoded: true };
  }

  // Everything else usually ends with the quote marker "2USD"
  code = code.replace(/2USD$/, '');
  if (!code) return { label: raw, raw, decoded: false };

  switch (category) {
    case 'CO':
      return {
        label: COMMODITY_ALIASES[code] ?? code,
        raw,
        category: 'commodity',
        decoded: true,
      };
    case 'SI':
      return { label: prettifyIndex(code), raw, category: 'index', decoded: true };
    case 'SK':
      return { label: code, raw, category: 'stock', decoded: true };
    default:
      return { label: code, raw, decoded: false };
  }
}

/** Convenience helper when only the display string is needed. */
export function getSymbolLabel(symbol?: string | null): string {
  return decodeSymbol(symbol).label;
}
