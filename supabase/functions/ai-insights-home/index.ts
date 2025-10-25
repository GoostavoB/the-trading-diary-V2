import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const symbol = 'BTCUSDT';
    const timeframe = '1h';

    // Fetch LSR data
    const lsrResponse = await fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=1`);
    const lsrData = await lsrResponse.json();
    const currentLSR = lsrData[0] ? parseFloat(lsrData[0].longShortRatio) : 1.0;

    // Fetch Open Interest
    const oiResponse = await fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=24`);
    const oiData = await oiResponse.json();
    const latestOI = oiData[0] ? parseFloat(oiData[0].sumOpenInterest) : 0;
    const oiChange24h = oiData.length >= 24 ? ((latestOI - parseFloat(oiData[23].sumOpenInterest)) / parseFloat(oiData[23].sumOpenInterest)) * 100 : 0;

    // Fetch Funding Rate
    const fundingResponse = await fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=1`);
    const fundingData = await fundingResponse.json();
    const currentFunding = fundingData[0] ? parseFloat(fundingData[0].fundingRate) * 100 : 0;

    // Fetch current price
    const priceResponse = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`);
    const priceData = await priceResponse.json();
    const currentPrice = parseFloat(priceData.price);

    // Fetch price 24h ago for comparison
    const price24hResponse = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1h&limit=24`);
    const price24hData = await price24hResponse.json();
    const price24hAgo = price24hData.length >= 24 ? parseFloat(price24hData[0][4]) : currentPrice;
    const priceChange24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;

    const marketInsights = [];

    // LSR Bias
    if (currentLSR < 1.0) {
      marketInsights.push({
        id: "lsr_bias_bullish",
        title: "Long–short ratio",
        metric: {
          label: "LSR",
          value: currentLSR.toFixed(2),
          window: "now"
        },
        rule: "LSR < 1.0 indicates buyer bias",
        action: "Avoid shorts until LSR returns to 1.0",
        confidence: 82,
        score: 0.75 + (1.0 - currentLSR) * 0.1,
        source: "exchange-derivatives",
        detailUrl: "/market-data"
      });
    } else if (currentLSR > 1.2) {
      marketInsights.push({
        id: "lsr_bias_bearish",
        title: "Long–short ratio",
        metric: {
          label: "LSR",
          value: currentLSR.toFixed(2),
          window: "now"
        },
        rule: "LSR > 1.2 indicates seller bias",
        action: "Avoid longs until LSR returns to 1.0",
        confidence: 82,
        score: 0.75 + (currentLSR - 1.2) * 0.1,
        source: "exchange-derivatives",
        detailUrl: "/market-data"
      });
    }

    // OI High with Stable Price
    if (oiChange24h >= 8 && Math.abs(priceChange24h) < 1) {
      marketInsights.push({
        id: "oi_high_price_stable",
        title: "High OI with stable price",
        metric: {
          label: "OI 24h",
          value: `+${oiChange24h.toFixed(1)}%`,
          window: "24h"
        },
        rule: "OI ≥ +8% with price sideways",
        action: "Risk of short squeeze, be cautious",
        confidence: 75,
        score: 0.72,
        source: "exchange-derivatives",
        detailUrl: "/market-data"
      });
    }

    // Funding Extremes
    if (currentFunding >= 0.05) {
      marketInsights.push({
        id: "funding_extreme_positive",
        title: "Extreme funding rate",
        metric: {
          label: "Funding 8h",
          value: `+${currentFunding.toFixed(3)}%`,
          window: "8h"
        },
        rule: "Funding ≥ +0.05% indicates crowded longs",
        action: "Longs are crowded, consider mean reversion",
        confidence: 78,
        score: 0.70 + currentFunding * 0.5,
        source: "exchange-derivatives",
        detailUrl: "/market-data"
      });
    } else if (currentFunding <= -0.05) {
      marketInsights.push({
        id: "funding_extreme_negative",
        title: "Extreme funding rate",
        metric: {
          label: "Funding 8h",
          value: `${currentFunding.toFixed(3)}%`,
          window: "8h"
        },
        rule: "Funding ≤ -0.05% indicates crowded shorts",
        action: "Shorts are crowded, consider mean reversion",
        confidence: 78,
        score: 0.70 + Math.abs(currentFunding) * 0.5,
        source: "exchange-derivatives",
        detailUrl: "/market-data"
      });
    }

    // OI Up Price Down
    if (oiChange24h >= 5 && priceChange24h <= -1) {
      marketInsights.push({
        id: "oi_up_price_down",
        title: "OI rising as price falls",
        metric: {
          label: "OI/Price divergence",
          value: `OI +${oiChange24h.toFixed(1)}% / Price ${priceChange24h.toFixed(1)}%`,
          window: "24h"
        },
        rule: "OI ≥ +5% with price ≤ -1%",
        action: "Risk of bounce or continuation squeeze",
        confidence: 72,
        score: 0.68,
        source: "exchange-derivatives",
        detailUrl: "/market-data"
      });
    }

    // Add generic insights if we have less than 6
    if (marketInsights.length < 6) {
      marketInsights.push({
        id: "market_overview",
        title: "Market overview",
        metric: {
          label: "BTC Price",
          value: `$${currentPrice.toFixed(2)}`,
          window: "now"
        },
        rule: `24h change: ${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`,
        action: "Monitor key levels and volume for next move",
        confidence: 60,
        score: 0.50,
        source: "exchange-spot",
        detailUrl: "/market-data"
      });
    }

    if (marketInsights.length < 6) {
      marketInsights.push({
        id: "oi_overview",
        title: "Open interest trend",
        metric: {
          label: "OI 24h",
          value: `${oiChange24h >= 0 ? '+' : ''}${oiChange24h.toFixed(1)}%`,
          window: "24h"
        },
        rule: oiChange24h > 0 ? "Increasing OI shows growing interest" : "Decreasing OI shows waning interest",
        action: oiChange24h > 0 ? "Trend may continue with participation" : "Watch for reversal or consolidation",
        confidence: 65,
        score: 0.55,
        source: "exchange-derivatives",
        detailUrl: "/market-data"
      });
    }

    // Sort by score
    marketInsights.sort((a, b) => b.score - a.score);

    return new Response(
      JSON.stringify({
        asOf: new Date().toISOString(),
        pair: symbol,
        timeframe: timeframe,
        user_insights: [],
        market_insights: marketInsights.slice(0, 8)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-insights-home:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
