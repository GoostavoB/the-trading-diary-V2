#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bumerangue - rodada semanal de backtest.

O que faz, em ordem:
  1. baixa velas NATIVAS de 4h e 6h da Binance (com timestamp -- nunca remontar
     a partir de um intervalo menor, ver nota no fim do arquivo);
  2. recalibra as duas tabelas do zero, mesmo metodo de sempre;
  3. le o Long/Short Ratio da Binance e mede o efeito do filtro de crowding;
  4. compara ativo a ativo com a rodada anterior e marca alta/queda;
  5. escreve public/data/bumerangue-backtests.json, que o dashboard le.

Uso:  python3 bumerangue_weekly.py [caminho/para/o/json]
Depende so de `requests`.
"""
import json, os, sys, time, math, statistics, datetime as dt
import requests

SAIDA = sys.argv[1] if len(sys.argv) > 1 else "public/data/bumerangue-backtests.json"
CACHE = os.environ.get("BUMERANGUE_CACHE", "/tmp/bumerangue_klines")
os.makedirs(CACHE, exist_ok=True)

KL   = "https://api.binance.com/api/v3/klines"
LSRU = "https://fapi.binance.com/futures/data/globalLongShortAccountRatio"
FEE, LOOK, MAX_WAIT = 0.001, 40, 8
DIAS, RISCO = 1095, 100.0
LSR_SHORT_MIN, LSR_LONG_MAX = 1.0, 1.8
LIMIAR_FLAG = 2.0            # pontos percentuais para marcar alta/queda

ATIVOS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","TRXUSDT","ZECUSDT","DOGEUSDT",
 "LINKUSDT","ADAUSDT","BCHUSDT","ENAUSDT","UNIUSDT","LTCUSDT","AVAXUSDT","SUIUSDT",
 "SHIBUSDT","NEARUSDT","DOTUSDT","POLUSDT","MATICUSDT","CAKEUSDT","INJUSDT","VIRTUALUSDT"]

TFS = {"4H": {"iv":"4h","horas":4,"esc":1.0}, "6H": {"iv":"6h","horas":6,"esc":1.26}}

# ---------------------------------------------------------------- indicadores
def rsi(c, n=14):
    out=[None]*len(c)
    if len(c)<n+1: return out
    g=l=0.0
    for i in range(1,n+1):
        d=c[i]-c[i-1]; g+=max(d,0); l+=max(-d,0)
    g/=n; l/=n
    out[n]=100.0 if l==0 else 100-100/(1+g/l)
    for i in range(n+1,len(c)):
        d=c[i]-c[i-1]
        g=(g*(n-1)+max(d,0))/n; l=(l*(n-1)+max(-d,0))/n
        out[i]=100.0 if l==0 else 100-100/(1+g/l)
    return out

def stoch_of(v, n=14):
    out=[None]*len(v)
    for i in range(len(v)):
        jan=[x for x in v[max(0,i-n+1):i+1] if x is not None]
        if v[i] is None or len(jan)<n: continue
        lo,hi=min(jan),max(jan)
        out[i]=50.0 if hi==lo else (v[i]-lo)/(hi-lo)*100
    return out

def sma(v, n):
    out=[None]*len(v)
    for i in range(len(v)):
        jan=v[max(0,i-n+1):i+1]
        if any(x is None for x in jan) or len(jan)<n: continue
        out[i]=sum(jan)/n
    return out

def ema(c, n=20):
    out=[None]*len(c)
    if len(c)<n: return out
    k=2/(n+1); e=sum(c[:n])/n; out[n-1]=e
    for i in range(n,len(c)):
        e=c[i]*k+e*(1-k); out[i]=e
    return out

# ---------------------------------------------------------------- dados
def velas(sym, iv, quantas):
    """Velas NATIVAS do intervalo pedido, com timestamp. Cache de 20h."""
    f=f"{CACHE}/{sym}_{iv}.json"
    if os.path.exists(f) and time.time()-os.path.getmtime(f) < 20*3600:
        d=json.load(open(f)); return d["t"],d["c"],d["h"],d["l"]
    linhas=[]; fim=int(time.time()*1000)
    while len(linhas)<quantas:
        try:
            r=requests.get(KL,params={"symbol":sym,"interval":iv,"endTime":fim,"limit":1000},timeout=30)
        except Exception:
            break
        if r.status_code!=200: break
        d=r.json()
        if not d: break
        linhas=d+linhas; fim=d[0][0]-1
        if len(d)<1000: break
        time.sleep(0.05)
    u={x[0]:x for x in linhas}; rr=sorted(u.values(), key=lambda x:x[0])
    out={"t":[x[0] for x in rr],"c":[float(x[4]) for x in rr],
         "h":[float(x[2]) for x in rr],"l":[float(x[3]) for x in rr]}
    json.dump(out, open(f,"w"))
    return out["t"],out["c"],out["h"],out["l"]

def lsr_binance(sym="BTCUSDT", periodo="1d", limite=30):
    """Binance so serve os ultimos 30 dias. Pedir mais devolve HTTP 400."""
    try:
        r=requests.get(LSRU,params={"symbol":sym,"period":periodo,"limit":limite},timeout=20)
        if r.status_code!=200: return {}
        return {dt.datetime.fromtimestamp(int(x["timestamp"])/1000,dt.timezone.utc).strftime("%Y-%m-%d"):
                float(x["longShortRatio"]) for x in r.json()}
    except Exception:
        return {}

# ---------------------------------------------------------------- motor
def corrida(i, dirn, stop, c, h, l, e20, n):
    """Stop ancorado no PRECO DE ENTRADA, nunca na mecha da vela."""
    en=c[i]; sp=en*(1+stop/100) if dirn=="short" else en*(1-stop/100)
    for j in range(i+1, min(i+1+LOOK, n)):
        if dirn=="short":
            if h[j]>=sp: return "STOP",(en-sp)/en
            if e20[j] is not None and l[j]<=e20[j]: return "ALVO",(en-e20[j])/en
        else:
            if l[j]<=sp: return "STOP",(sp-en)/en
            if e20[j] is not None and h[j]>=e20[j]: return "ALVO",(e20[j]-en)/en
    j=min(i+LOOK, n-1)
    return "TEMPO",((en-c[j])/en if dirn=="short" else (c[j]-en)/en)

def toques(c, corte_ts, ts):
    n=len(c)
    K=sma(stoch_of(rsi(c,14),14),3); D=sma(K,3); e20=ema(c,20)
    at=ab=True; tops=[]; bots=[]
    for i,v in enumerate(K):
        if v is None: continue
        if v>=90 and at: tops.append(i); at=False
        if v<70: at=True
        if v<=10 and ab: bots.append(i); ab=False
        if v>30: ab=True
    def cruz(s,w):
        for j in range(s+1, min(s+1+MAX_WAIT, n)):
            if None in (K[j],D[j],K[j-1],D[j-1]): continue
            if w=="under" and K[j-1]>=D[j-1] and K[j]<D[j]: return j
            if w=="over"  and K[j-1]<=D[j-1] and K[j]>D[j]: return j
        return None
    dentro=lambda i: ts[i] >= corte_ts
    S=[]; Lt=[]; Lc=[]
    for i in tops:
        j=cruz(i,"under")
        if j is not None and dentro(j) and e20[j] is not None and c[j]>e20[j]:
            S.append((j,(c[j]-e20[j])/c[j]*100))
    for i in bots:
        if dentro(i) and e20[i] is not None and c[i]<e20[i]:
            Lt.append((i,(e20[i]-c[i])/c[i]*100))
        j=cruz(i,"over")
        if j is not None and dentro(j) and e20[j] is not None and c[j]<e20[j]:
            Lc.append((j,(e20[j]-c[j])/c[j]*100))
    return S,Lt,Lc,e20

def calibra(tf):
    cfg=TFS[tf]; esc=cfg["esc"]
    bandas=[(0.5*esc,1.0*esc),(1.0*esc,1.5*esc),(1.5*esc,2.0*esc),
            (2.0*esc,3.0*esc),(3.0*esc,4.0*esc),(4.0*esc,5.0*esc)]
    keys=[f"{lo:.2f}-{hi:.2f}" for lo,hi in bandas]
    stops=[round(s*esc,2) for s in [1.0,1.5,2.0,2.5,3.0,3.5,4.0,5.0]]
    corte=int((dt.datetime.now(dt.timezone.utc)-dt.timedelta(days=DIAS)).timestamp()*1000)
    quantas=int(DIAS*24/cfg["horas"])+200
    master={}; modos={}; trades=[]
    for sym in ATIVOS:
        nome=sym.replace("USDT","")
        ts,c,h,l=velas(sym,cfg["iv"],quantas)
        n=len(c)
        if n<300: continue
        S,Lt,Lc,e20=toques(c,corte,ts)
        def esperanca(lst,dirn):
            ev=[(i,rw) for i,rw in lst if bandas[0][0]<=rw<bandas[-1][1]]
            if not ev: return -9
            s=2.5*esc
            return sum((corrida(i,dirn,s,c,h,l,e20,n)[1]-2*FEE)/(s/100) for i,_ in ev)/len(ev)
        usa=esperanca(Lc,"long")-esperanca(Lt,"long")>=0.15
        L=Lc if usa else Lt
        modos[nome]={"SHORT":"cruz","LONG":"cruz" if usa else "toque"}
        master[nome]={"SHORT":{},"LONG":{}}
        for lado,lst,dirn in [("SHORT",S,"short"),("LONG",L,"long")]:
            for bi,(lo,hi) in enumerate(bandas):
                sub=[(i,rw) for i,rw in lst if lo<=rw<hi]
                if len(sub)<8:
                    master[nome][lado][keys[bi]]={"n":len(sub),"status":"insuf"}; continue
                med=statistics.median([rw for _,rw in sub]); cand=[]
                for s in stops:
                    out=[corrida(i,dirn,s,c,h,l,e20,n) for i,_ in sub]
                    wr=sum(1 for o,_ in out if o=="ALVO")/len(sub)*100
                    if med/s>=0.5: cand.append((wr,med/s,s))
                if not cand:
                    master[nome][lado][keys[bi]]={"n":len(sub),"status":"nao operar"}; continue
                cand.sort(key=lambda x:(-x[0],-x[1])); wr,rr,s=cand[0]
                master[nome][lado][keys[bi]]={"n":len(sub),"status":"ok","stop":s,
                    "wr":round(wr,1),"lucro":round(med,2),"rr":round(rr,2)}
                if wr>=70:
                    for i,_ in sub:
                        o,ret=corrida(i,dirn,s,c,h,l,e20,n)
                        trades.append({"ativo":nome,"lado":lado,"tf":tf,"o":o,
                            "R":(ret-2*FEE)/(s/100),
                            "dia":dt.datetime.fromtimestamp(ts[i]/1000,dt.timezone.utc).strftime("%Y-%m-%d"),
                            "mes":dt.datetime.fromtimestamp(ts[i]/1000,dt.timezone.utc).strftime("%Y-%m")})
    return master,modos,trades,keys,stops

# ---------------------------------------------------------------- agregacao
def resumo(trades):
    if not trades: return {}
    n=len(trades)
    ac=sum(1 for t in trades if t["o"]=="ALVO")/n*100
    R=sum(t["R"] for t in trades)/n
    meses=sorted({t["mes"] for t in trades})
    porMes={}
    for t in trades: porMes[t["mes"]]=porMes.get(t["mes"],0)+RISCO*t["R"]
    cheios=meses[1:-1] or meses
    vals=sorted(porMes[m] for m in cheios)
    return {
        "trades": n,
        "acerto": round(ac,1),
        "expectativa_r": round(R,3),
        "sinais_por_mes": round(n/max(len(cheios),1),1),
        "usd_media_mes": round(sum(vals)/len(vals)),
        "usd_mediana_mes": round(vals[len(vals)//2]),
        "pior_mes": round(vals[0]),
        "melhor_mes": round(vals[-1]),
        "meses_negativos": sum(1 for v in vals if v<0),
        "meses_total": len(vals),
    }

def por_ativo(trades):
    d={}
    for t in trades:
        k=t["ativo"]
        d.setdefault(k,{"trades":0,"alvos":0,"R":0.0})
        d[k]["trades"]+=1; d[k]["alvos"]+= 1 if t["o"]=="ALVO" else 0; d[k]["R"]+=t["R"]
    out={}
    for k,v in d.items():
        out[k]={"trades":v["trades"],
                "acerto":round(v["alvos"]/v["trades"]*100,1),
                "expectativa_r":round(v["R"]/v["trades"],3),
                "usd_total":round(RISCO*v["R"])}
    return out

def celulas_operaveis(master):
    return sum(1 for a in master.values() for s in a.values() for c in s.values()
               if c.get("status")=="ok" and c.get("wr",0)>=70)

def efeito_lsr(trades, lsr):
    """Cruza cada trade com o LSR do dia em que ele nasceu. So da pra medir nos
    dias em que existe LSR -- por isso a serie e acumulada entre rodadas."""
    com=[t for t in trades if t["dia"] in lsr]
    if len(com)<30: return None
    CONFIAVEL=300   # abaixo disso o numero e indicativo, nao conclusao
    def m(ts):
        if not ts: return None
        return {"trades":len(ts),
                "acerto":round(sum(1 for t in ts if t["o"]=="ALVO")/len(ts)*100,1),
                "usd_por_trade":round(RISCO*sum(t["R"] for t in ts)/len(ts),2)}
    passa=lambda t: not (t["lado"]=="SHORT" and lsr[t["dia"]]<LSR_SHORT_MIN) and \
                    not (t["lado"]=="LONG"  and lsr[t["dia"]]>LSR_LONG_MAX)
    return {"janela_dias": len({t["dia"] for t in com}),
            "trades_cruzados": len(com),
            "amostra_suficiente": len(com) >= CONFIAVEL,
            "sem_filtro": m(com), "com_filtro": m([t for t in com if passa(t)]),
            "bloqueados": m([t for t in com if not passa(t)])}

def bandeira(atual, anterior):
    if anterior is None: return {"flag":"novo","delta":None}
    d=round(atual-anterior,1)
    if d >=  LIMIAR_FLAG: return {"flag":"alta","delta":d}
    if d <= -LIMIAR_FLAG: return {"flag":"queda","delta":d}
    return {"flag":"estavel","delta":d}

# ---------------------------------------------------------------- relatorio
def relatorio(agora, antes):
    pos=[]; neg=[]; obs=[]
    for tf in ("4H","6H"):
        a=agora["timeframes"][tf]["resumo"]
        b=(antes or {}).get("timeframes",{}).get(tf,{}).get("resumo") if antes else None
        if b:
            d=round(a["acerto"]-b["acerto"],1)
            if d>=1.0:  pos.append(f"{tf}: acerto subiu {d:+.1f} pontos, para {a['acerto']}%")
            elif d<=-1.0: neg.append(f"{tf}: acerto caiu {d:+.1f} pontos, para {a['acerto']}%")
            else: obs.append(f"{tf}: acerto estavel em {a['acerto']}% ({d:+.1f})")
            dc=a["celulas_operaveis"]-b.get("celulas_operaveis",a["celulas_operaveis"]) \
               if "celulas_operaveis" in b else 0
            if dc<=-3: neg.append(f"{tf}: {abs(dc)} celulas sairam da faixa operavel")
            elif dc>=3: pos.append(f"{tf}: {dc} celulas novas entraram na faixa operavel")
        else:
            obs.append(f"{tf}: primeira rodada, {a['acerto']}% de acerto em {a['trades']} trades")
    for tf in ("4H","6H"):
        for ativo,v in agora["timeframes"][tf]["ativos"].items():
            f=v.get("bandeira",{})
            if f.get("flag")=="alta":  pos.append(f"{tf} {ativo}: {f['delta']:+.1f} pontos, agora {v['acerto']}%")
            if f.get("flag")=="queda": neg.append(f"{tf} {ativo}: {f['delta']:+.1f} pontos, agora {v['acerto']}%")
    lsr=agora.get("lsr",{})
    if lsr.get("atual") is not None:
        v=lsr["atual"]
        if v < LSR_SHORT_MIN:
            neg.append(f"LSR do BTC em {v:.2f}, abaixo de {LSR_SHORT_MIN} -- shorts pedem cautela")
        elif v > LSR_LONG_MAX:
            neg.append(f"LSR do BTC em {v:.2f}, acima de {LSR_LONG_MAX} -- longs pedem cautela")
        else:
            obs.append(f"LSR do BTC em {v:.2f}, dentro da faixa neutra")
    j4=agora["timeframes"]["4H"]["resumo"]; j6=agora["timeframes"]["6H"]["resumo"]
    texto=(f"{j4['sinais_por_mes']+j6['sinais_por_mes']:.1f} sinais por mes somando 4H e 6H. "
           f"4H acerta {j4['acerto']}% ({j4['trades']} trades), 6H acerta {j6['acerto']}% "
           f"({j6['trades']} trades). Com risco de ${RISCO:.0f} por trade a media e "
           f"${j4['usd_media_mes']+j6['usd_media_mes']:,} por mes, mediana "
           f"${j4['usd_mediana_mes']+j6['usd_mediana_mes']:,}.")
    return {"texto":texto,"positivas":pos,"negativas":neg,"observacoes":obs}

# ---------------------------------------------------------------- principal
def main():
    inicio=time.time()
    anterior=None
    if os.path.exists(SAIDA):
        try: anterior=json.load(open(SAIDA)).get("atual")
        except Exception: anterior=None

    # A Binance so serve 30 dias de LSR. A saida guarda a serie inteira e cada
    # rodada MERGEIA os 30 dias novos, entao o historico cresce sozinho semana
    # apos semana. A serie foi semeada com 180 dias da OKX (escalas conferidas:
    # medias 1,31 x 1,29, correlacao +0,80 nos dias em comum).
    lsr_novo = lsr_binance()
    lsr = dict((anterior or {}).get("lsr", {}).get("serie", {}))
    lsr.update(lsr_novo)                 # Binance sobrescreve o que houver
    lsr_atual = lsr_novo[max(lsr_novo)] if lsr_novo else (lsr[max(lsr)] if lsr else None)

    saida={"setup":"bumerangue",
           "gerado_em":dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
           "janela_dias":DIAS,"risco_por_trade_usd":RISCO,
           "ativos":len(ATIVOS),"timeframes":{},
           "lsr":{"atual":lsr_atual,"fonte":"Binance globalLongShortAccountRatio",
                  "historico_dias":len(lsr),"dias_novos_nesta_rodada":len(lsr_novo),
                  "limite_short":LSR_SHORT_MIN,"limite_long":LSR_LONG_MAX,
                  "serie":lsr}}

    todos=[]
    for tf in ("4H","6H"):
        master,modos,trades,keys,stops=calibra(tf)
        todos+=trades
        r=resumo(trades); r["celulas_operaveis"]=celulas_operaveis(master)
        ativos=por_ativo(trades)
        ant_tf=(anterior or {}).get("timeframes",{}).get(tf,{}) if anterior else {}
        for nome,v in ativos.items():
            v["bandeira"]=bandeira(v["acerto"], (ant_tf.get("ativos",{}).get(nome) or {}).get("acerto"))
        saida["timeframes"][tf]={"resumo":r,"ativos":ativos,"modos":modos,
                                 "bandas":keys,"stops":stops,"tabela":master}
    saida["lsr"]["efeito"]=efeito_lsr(todos,lsr)
    saida["relatorio"]=relatorio(saida,anterior)
    saida["duracao_s"]=round(time.time()-inicio,1)

    hist=[]
    if os.path.exists(SAIDA):
        try:
            velho=json.load(open(SAIDA))
            hist=velho.get("historico",[])
            if velho.get("atual"):
                a=velho["atual"]
                hist.append({"gerado_em":a["gerado_em"],
                    "4H":{k:a["timeframes"]["4H"]["resumo"].get(k) for k in ("acerto","trades","expectativa_r","usd_media_mes","celulas_operaveis")},
                    "6H":{k:a["timeframes"]["6H"]["resumo"].get(k) for k in ("acerto","trades","expectativa_r","usd_media_mes","celulas_operaveis")},
                    "lsr":a.get("lsr",{}).get("atual")})
        except Exception: pass
    hist=hist[-52:]

    os.makedirs(os.path.dirname(SAIDA) or ".", exist_ok=True)
    json.dump({"atual":saida,"historico":hist}, open(SAIDA,"w"), ensure_ascii=False, indent=1)

    r=saida["relatorio"]
    print(f"OK em {saida['duracao_s']}s -> {SAIDA}")
    print(r["texto"])
    for t,l in (("+",r["positivas"]),("-",r["negativas"])):
        for x in l[:12]: print(f"  {t} {x}")

if __name__ == "__main__":
    main()

# NOTA IMPORTANTE, aprendida do jeito dificil:
# nunca remontar velas de 4h/6h a partir de um intervalo menor sem timestamp.
# A remontagem comeca num offset arbitrario e desalinha tudo em relacao as velas
# reais da Binance e do TradingView. Isso derrubou o acerto medido de 77,8% para
# 68,2% num teste, e produziu uma tabela de 6H inflada. Sempre pedir o intervalo
# nativo (a Binance oferece 4h, 6h, 8h, 12h) e guardar o timestamp junto.
