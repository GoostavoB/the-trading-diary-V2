#!/usr/bin/env python3
"""Calcula S/R técnicos de candles diários reais (Binance/Bybit spot).
Método: fractais (w=5) -> clustering (tolerância %) -> score = toques + recência.
Também: HVN (volume por faixa de preço), MAs chave, 52w hi/lo, round numbers."""
import json, math, subprocess

SYMBOLS = [
    ("BTC", "BTCUSDT", 0.015), ("ETH", "ETHUSDT", 0.015), ("BNB", "BNBUSDT", 0.02),
    ("XRP", "XRPUSDT", 0.025), ("SOL", "SOLUSDT", 0.025), ("TRX", "TRXUSDT", 0.02),
    ("DOGE", "DOGEUSDT", 0.03), ("ZEC", "ZECUSDT", 0.03), ("XLM", "XLMUSDT", 0.025),
]

def fetch(url):
    out = subprocess.run(
        ["curl", "-s", "--max-time", "30", "-A", "Mozilla/5.0", url],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)

def klines_binance(sym, interval="1d", limit=500):
    d = fetch(f"https://api.binance.com/api/v3/klines?symbol={sym}&interval={interval}&limit={limit}")
    return [(float(k[2]), float(k[3]), float(k[4]), float(k[7])) for k in d]  # high, low, close, quoteVol

def klines_bybit(sym, limit=500):
    d = fetch(f"https://api.bybit.com/v5/market/kline?category=spot&symbol={sym}&interval=D&limit={limit}")
    rows = d["result"]["list"][::-1]
    return [(float(k[2]), float(k[3]), float(k[4]), float(k[5]) * float(k[4])) for k in rows]

def swings(data, w=5):
    his, los = [], []
    for i in range(w, len(data) - w):
        h = data[i][0]; l = data[i][1]
        if h == max(d[0] for d in data[i-w:i+w+1]): his.append((i, h))
        if l == min(d[1] for d in data[i-w:i+w+1]): los.append((i, l))
    return his, los

def cluster(points, tol, n_total):
    """points: [(idx, price)] -> clusters {price, touches, score, last_idx}"""
    out = []
    for idx, p in sorted(points, key=lambda x: x[1]):
        for c in out:
            if abs(p - c["px"]) / c["px"] <= tol:
                c["members"].append((idx, p)); break
        else:
            out.append({"px": p, "members": [(idx, p)]})
    for c in out:
        prices = [m[1] for m in c["members"]]
        c["px"] = sum(prices) / len(prices)
        c["touches"] = len(c["members"])
        recency = max(m[0] for m in c["members"]) / n_total
        c["score"] = c["touches"] + 1.5 * recency
    return out

def hvn(data, bins=40):
    lo = min(d[1] for d in data); hi = max(d[0] for d in data)
    step = (hi - lo) / bins
    vol = [0.0] * bins
    for h, l, c, qv in data:
        b = min(bins - 1, int((c - lo) / step))
        vol[b] += qv
    ranked = sorted(range(bins), key=lambda b: -vol[b])[:3]
    return sorted(lo + (b + 0.5) * step for b in ranked)

def ma(closes, n):
    return sum(closes[-n:]) / n if len(closes) >= n else None

def rounds(px):
    out = set()
    for mult in (1, 2, 2.5, 5):
        exp = 10 ** math.floor(math.log10(px))
        for e in (exp / 10, exp, exp * 10):
            base = mult * e
            k = round(px / base)
            for cand in (base * (k - 1), base * k, base * (k + 1)):
                if cand > 0 and abs(cand - px) / px <= 0.12:
                    out.add(round(cand, 6))
    return sorted(out)

def fmt(p):
    return f"{p:,.0f}" if p >= 100 else (f"{p:,.2f}" if p >= 1 else f"{p:.4f}")

for name, sym, tol in SYMBOLS + [("HYPE", "HYPEUSDT", 0.03)]:
    try:
        data = klines_binance(sym) if name != "HYPE" else klines_bybit(sym)
    except Exception as e1:
        try:
            data = klines_bybit(sym)
        except Exception as e2:
            print(f"== {name}: FALHOU ({e1} / {e2})"); continue
    closes = [d[2] for d in data]
    px = closes[-1]
    his, los = swings(data)
    res = [c for c in cluster(his, tol, len(data)) if c["px"] > px * 1.005]
    sup = [c for c in cluster(los, tol, len(data)) if c["px"] < px * 0.995]
    res = sorted(res, key=lambda c: -c["score"])[:6]
    sup = sorted(sup, key=lambda c: -c["score"])[:6]
    w52h = max(d[0] for d in data[-365:]); w52l = min(d[1] for d in data[-365:])
    print(f"== {name} px={fmt(px)} 52wH={fmt(w52h)} 52wL={fmt(w52l)} "
          f"MA50={fmt(ma(closes,50) or 0)} MA100={fmt(ma(closes,100) or 0)} MA200={fmt(ma(closes,200) or 0)}")
    print("  RES: " + " | ".join(f"{fmt(c['px'])} ({c['touches']}t)" for c in sorted(res, key=lambda c: c['px'])))
    print("  SUP: " + " | ".join(f"{fmt(c['px'])} ({c['touches']}t)" for c in sorted(sup, key=lambda c: c['px'])))
    print("  HVN: " + " | ".join(fmt(v) for v in hvn(data)))
    print("  ROUND: " + " | ".join(fmt(r) for r in rounds(px)))
