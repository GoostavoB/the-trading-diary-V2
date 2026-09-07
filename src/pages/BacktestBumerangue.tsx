import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Minus, Sparkles,
  AlertTriangle, ShieldCheck, Clock,
} from 'lucide-react';
import { useBacktestData, type AtivoTF, type Bandeira } from '@/hooks/useBacktestData';

const fmtUsd = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

function BandeiraTag({ b }: { b?: { flag: Bandeira; delta: number | null } }) {
  if (!b || b.flag === 'novo')
    return <span className="text-xs text-muted-foreground">primeira rodada</span>;
  if (b.flag === 'alta')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
        <ArrowUpRight className="h-3.5 w-3.5" />
        {b.delta?.toFixed(1)}
      </span>
    );
  if (b.flag === 'queda')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
        <ArrowDownRight className="h-3.5 w-3.5" />
        {b.delta?.toFixed(1)}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
      {b.delta?.toFixed(1)}
    </span>
  );
}

function Metrica({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{rotulo}</div>
      <div className="text-xl font-semibold tabular-nums truncate">{valor}</div>
      {nota && <div className="text-xs text-muted-foreground mt-0.5">{nota}</div>}
    </div>
  );
}

export default function BacktestBumerangue() {
  const { data, isLoading, error } = useBacktestData('bumerangue');
  const [tf, setTf] = useState<'4H' | '6H'>('4H');

  const atual = data?.atual;
  const bloco = atual?.timeframes?.[tf];

  const ativos = useMemo(() => {
    if (!bloco) return [] as Array<[string, AtivoTF]>;
    return Object.entries(bloco.ativos).sort((a, b) => b[1].acerto - a[1].acerto);
  }, [bloco]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (error || !atual || !bloco) {
    return (
      <AppLayout>
        <PremiumCard className="p-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Os dados do backtest não carregaram.</p>
          <p className="text-sm text-muted-foreground mt-1">
            O arquivo é gerado pela rodada semanal. Se acabou de publicar, aguarde o build terminar.
          </p>
        </PremiumCard>
      </AppLayout>
    );
  }

  const r = bloco.resumo;
  const lsr = atual.lsr;
  const lsrAlerta =
    lsr.atual == null ? null : lsr.atual < lsr.limite_short ? 'short' : lsr.atual > lsr.limite_long ? 'long' : null;

  const gerado = new Date(atual.gerado_em).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <AppLayout>
      <SEO
        title="Dashboard Bumerangue"
        description="Backtest semanal do setup Bumerangue: acerto por ativo, expectativa e filtro de crowding pelo LSR."
      />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              to="/back-tests"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back Tests
            </Link>
            <h1 className="text-2xl font-bold">Dashboard Bumerangue</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Rodada de {gerado} · janela de {atual.janela_dias} dias · {atual.ativos} ativos
            </p>
          </div>
          <Tabs value={tf} onValueChange={(v) => setTf(v as '4H' | '6H')}>
            <TabsList>
              <TabsTrigger value="4H">4H</TabsTrigger>
              <TabsTrigger value="6H">6H</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ---------------- relatório semanal ---------------- */}
        <PremiumCard className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Relatório semanal</h2>
          </div>
          <p className="text-sm leading-relaxed">{atual.relatorio.texto}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-emerald-500 mb-2">
                Sinais positivos ({atual.relatorio.positivas.length})
              </div>
              {atual.relatorio.positivas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nada subiu de forma relevante nesta rodada.</p>
              ) : (
                <ul className="space-y-1.5">
                  {atual.relatorio.positivas.map((t, i) => (
                    <li key={i} className="text-xs flex gap-2">
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-px" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-red-500 mb-2">
                Sinais negativos ({atual.relatorio.negativas.length})
              </div>
              {atual.relatorio.negativas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nada caiu de forma relevante nesta rodada.</p>
              ) : (
                <ul className="space-y-1.5">
                  {atual.relatorio.negativas.map((t, i) => (
                    <li key={i} className="text-xs flex gap-2">
                      <ArrowDownRight className="h-3.5 w-3.5 text-red-500 shrink-0 mt-px" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {atual.relatorio.observacoes.length > 0 && (
            <div className="pt-1 border-t border-border/50">
              <div className="text-xs text-muted-foreground mt-3 space-y-1">
                {atual.relatorio.observacoes.map((t, i) => (
                  <div key={i}>{t}</div>
                ))}
              </div>
            </div>
          )}
        </PremiumCard>

        {/* ---------------- números do timeframe ---------------- */}
        <PremiumCard className="p-6">
          <div className="grid gap-5 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            <Metrica rotulo="Taxa de acerto" valor={`${r.acerto}%`} nota={`${r.trades} trades`} />
            <Metrica rotulo="Sinais por mês" valor={`${r.sinais_por_mes}`} />
            <Metrica rotulo="Expectativa" valor={`${r.expectativa_r > 0 ? '+' : ''}${r.expectativa_r}R`} nota="por trade, líquido" />
            <Metrica rotulo="Média mensal" valor={fmtUsd(r.usd_media_mes)} nota={`risco $${atual.risco_por_trade_usd}/trade`} />
            <Metrica rotulo="Mediana mensal" valor={fmtUsd(r.usd_mediana_mes)} nota="o mês típico" />
            <Metrica rotulo="Pior mês" valor={fmtUsd(r.pior_mes)} nota={`${r.meses_negativos} de ${r.meses_total} no vermelho`} />
            <Metrica rotulo="Células operáveis" valor={`${r.celulas_operaveis}`} nota="acerto ≥ 70%" />
          </div>
          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
            A média fica acima da mediana porque poucos meses grandes puxam o número. A mediana é o
            mês típico — é ela que descreve a rotina.
          </p>
        </PremiumCard>

        {/* ---------------- LSR ---------------- */}
        <PremiumCard className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {lsrAlerta ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              )}
              <h2 className="font-semibold">Crowding pelo Long/Short Ratio</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">LSR do BTC agora</span>
              <Badge variant={lsrAlerta ? 'destructive' : 'secondary'} className="tabular-nums">
                {lsr.atual?.toFixed(2) ?? '—'}
              </Badge>
            </div>
          </div>

          {lsrAlerta === 'short' && (
            <p className="text-sm text-amber-500">
              Abaixo de {lsr.limite_short}: o mercado já está muito vendido. Shorts pedem cautela.
            </p>
          )}
          {lsrAlerta === 'long' && (
            <p className="text-sm text-amber-500">
              Acima de {lsr.limite_long}: o mercado já está muito comprado. Longs pedem cautela.
            </p>
          )}
          {!lsrAlerta && (
            <p className="text-sm text-muted-foreground">
              Entre {lsr.limite_short} e {lsr.limite_long}: faixa neutra, sem alerta de aglomeração.
            </p>
          )}

          {lsr.efeito && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {([
                  ['Sem filtro', lsr.efeito.sem_filtro],
                  ['Com filtro', lsr.efeito.com_filtro],
                  ['O que seria bloqueado', lsr.efeito.bloqueados],
                ] as const).map(([rotulo, v]) => (
                  <div key={rotulo} className="rounded-lg border border-border/50 p-3">
                    <div className="text-xs text-muted-foreground">{rotulo}</div>
                    <div className="text-lg font-semibold tabular-nums">{v.acerto}%</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {v.trades} trades · ${v.usd_por_trade}/trade
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Medido em {lsr.efeito.janela_dias} dias com LSR disponível ({lsr.efeito.trades_cruzados} trades cruzados).
                {!lsr.efeito.amostra_suficiente && ' Amostra ainda pequena — trate como indicação, não conclusão.'}
                {' '}A Binance só serve 30 dias de LSR, então a série é acumulada a cada rodada e cresce sozinha
                ({lsr.historico_dias} dias guardados até agora).
              </p>
            </>
          )}
        </PremiumCard>

        {/* ---------------- ativo por ativo ---------------- */}
        <PremiumCard className="p-0 overflow-hidden">
          <div className="p-6 pb-4">
            <h2 className="font-semibold">Ativo por ativo · {tf}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              A seta compara com a rodada anterior. Move quando passa de 2 pontos percentuais.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border/50 text-xs text-muted-foreground">
                  <th className="text-left font-medium px-6 py-2">Ativo</th>
                  <th className="text-right font-medium px-3 py-2">Trades</th>
                  <th className="text-right font-medium px-3 py-2">Acerto</th>
                  <th className="text-right font-medium px-3 py-2">vs. semana</th>
                  <th className="text-right font-medium px-3 py-2">Expectativa</th>
                  <th className="text-right font-medium px-6 py-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {ativos.map(([nome, v]) => (
                  <tr key={nome} className="border-b border-border/30 last:border-0">
                    <td className="px-6 py-2.5 font-medium">{nome}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{v.trades}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium">{v.acerto}%</td>
                    <td className="px-3 py-2.5 text-right"><BandeiraTag b={v.bandeira} /></td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {v.expectativa_r > 0 ? '+' : ''}{v.expectativa_r}R
                    </td>
                    <td className={`px-6 py-2.5 text-right tabular-nums ${v.usd_total >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {fmtUsd(v.usd_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumCard>

        <p className="text-xs text-muted-foreground">
          Todos os números são in-sample: o stop de cada célula foi escolhido varrendo candidatos
          nos mesmos dados em que o resultado foi medido. Slippage não está modelado, só a taxa de
          0,1% por lado. Nada foi operado com dinheiro real.
        </p>
      </div>
    </AppLayout>
  );
}
