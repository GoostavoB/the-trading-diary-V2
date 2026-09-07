# Rodada semanal do Bumerangue

`bumerangue_weekly.py` refaz o backtest inteiro e reescreve
`public/data/bumerangue-backtests.json`, que é o que o Dashboard Bumerangue lê.

```bash
python3 scripts/bumerangue_weekly.py public/data/bumerangue-backtests.json
git add public/data/bumerangue-backtests.json && git commit && git push
```

Só depende de `requests`. Leva menos de um minuto com o cache quente, alguns
minutos na primeira vez (baixa 3 anos de velas de 23 ativos em dois timeframes).

## Por que JSON no repo e não uma tabela no banco

Estes números são dados de referência globais: iguais para todo usuário e
atualizados uma vez por semana. Num JSON versionado, cada rodada vira um commit
— histórico auditável de graça, sem tabela, sem RLS, sem migração. O arquivo
carrega também os últimos 52 resultados em `historico`.

## A armadilha que já custou caro

O script pede o intervalo **nativo** da Binance (`4h`, `6h`) e guarda o
timestamp de cada vela. Nunca remonte velas de 4h/6h a partir de 1h: sem
timestamp a remontagem começa num offset arbitrário e desalinha tudo em relação
às velas reais da Binance e do TradingView. Isso já derrubou o acerto medido de
77,8% para 68,2% num teste, e gerou uma tabela de 6H inflada.

## LSR

A Binance só serve **30 dias** de Long/Short Ratio — pedir mais devolve HTTP 400.
Por isso cada rodada mescla os 30 dias novos na série guardada, que cresce
sozinha semana após semana. A série foi semeada com 180 dias da OKX (escalas
conferidas: médias 1,31 x 1,29, correlação +0,80 nos dias em comum).
