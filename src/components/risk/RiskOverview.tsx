import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRiskCopilot } from '@/hooks/useRiskCopilot';
import {
  ShieldCheck, AlertTriangle, TrendingDown, Info, ArrowUpRight, Gauge,
} from 'lucide-react';
import {
  curvaDeCapital, disciplinaDeStop, piorPerda, riscoPorSetup,
} from '@/lib/riskInsights';
import type { Trade } from '@/types/trade';

/**
 * Substitui a antiga aba "Overview", que era código de rascunho publicado:
 * exposição diária = média das perdas × 0,5, semanal = diária × 3, "Open
 * Positions Risk" = a constante 250, e tudo isso sobre uma banca fixa de
 * $10.000. Nenhum daqueles seis números vinha dos dados do usuário.
 *
 * Aqui a regra é: sem dado, a tela diz que não sabe. E cada bloco responde a
 * uma pergunta que muda uma decisão — não existe número de enfeite.
 */

function Metrica({
  rotulo, valor, nota, tom = 'neutro', acao,
}: {
  rotulo: string;
  valor: React.ReactNode;
  nota?: React.ReactNode;
  tom?: 'bom' | 'atencao' | 'ruim' | 'neutro';
  /** O que fazer quando este número piora. É a parte educativa. */
  acao?: string;
}) {
  const cor =
    tom === 'bom' ? 'text-emerald-500'
    : tom === 'ruim' ? 'text-red-500'
    : tom === 'atencao' ? 'text-amber-500'
    : 'text-foreground';
  return (
    <PremiumCard className="p-5 space-y-1.5">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{rotulo}</div>
      <div className={`text-2xl font-semibold tabular-nums ${cor}`}>{valor}</div>
      {nota && <div className="text-xs text-muted-foreground">{nota}</div>}
      {acao && (
        <div className="flex gap-1.5 pt-2 mt-1 border-t border-border/40">
          <Info className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground leading-relaxed">{acao}</span>
        </div>
      )}
    </PremiumCard>
  );
}

export function RiskOverview() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const rc = useRiskCopilot();

  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ['risk-overview-trades', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('trade_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Trade[];
    },
    enabled: !!user?.id,
  });

  const { data: aportes = [] } = useQuery({
    queryKey: ['risk-overview-capital', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('capital_log')
        .select('log_date, amount_added')
        .order('log_date', { ascending: true });
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const calc = useMemo(() => {
    if (!trades.length) return null;
    const curva = curvaDeCapital(trades, aportes as never);
    const fim = curva[curva.length - 1];
    const quedaMax = curva.reduce((pior, p) => Math.min(pior, p.quedaPct), 0);
    return {
      curva,
      capitalAtual: fim?.capital ?? 0,
      quedaAtual: fim?.quedaPct ?? 0,
      quedaMax,
      pior: piorPerda(trades),
      disciplina: disciplinaDeStop(trades),
      setups: riscoPorSetup(trades),
    };
  }, [trades, aportes]);

  if (isLoading) {
    return <PremiumCard className="p-8 text-center text-sm text-muted-foreground">Carregando…</PremiumCard>;
  }

  if (!calc) {
    return (
      <PremiumCard className="p-8 text-center space-y-2">
        <Gauge className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="font-medium">Ainda não há trades para medir risco.</p>
        <p className="text-sm text-muted-foreground">
          Estes números saem do teu histórico. Enquanto não houver operações registradas,
          esta tela não tem o que dizer — e prefere dizer isso a estimar.
        </p>
      </PremiumCard>
    );
  }

  const { disciplina, setups } = calc;
  const stopRespeitado = disciplina.avaliados > 0 && disciplina.estourados === 0;

  return (
    <div className="space-y-6">
      {/* ── 1. Onde o risco está agora ───────────────────────── */}
      <div>
        <h2 className="font-semibold mb-1">Onde teu risco está agora</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Capital real e o que o teu perfil de risco autoriza perder no próximo trade.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica
            rotulo="Capital de risco"
            valor={formatAmount(rc.capitalBase)}
            nota={
              <>
                {formatAmount(rc.capitalAportado)} aportado
                {rc.capitalResultado !== 0 && (
                  <span className={rc.capitalResultado > 0 ? ' text-emerald-500' : ' text-red-500'}>
                    {' '}{rc.capitalResultado > 0 ? '+' : '−'}{formatAmount(Math.abs(rc.capitalResultado))}
                  </span>
                )}
              </>
            }
            acao="Sobe quando você ganha ou aporta, cai quando perde ou saca. Todo stop abaixo é uma fração deste número."
          />
          <Metrica
            rotulo="Stop autorizado hoje"
            valor={formatAmount(rc.authorizedStopDollar)}
            nota={`${rc.authorizedStopPct.toFixed(1)}% do capital · faixa ${rc.tierLabel}`}
            tom="neutro"
            acao="É o máximo que você aceita perder num trade. Se a perda planejada passar disso, reduza o tamanho — não afaste o stop."
          />
          <Metrica
            rotulo="Pior perda já realizada"
            valor={calc.pior === null ? '—' : formatAmount(calc.pior)}
            nota={calc.pior === null ? 'nenhum trade perdedor ainda' : 'num único trade, líquida'}
            tom={calc.pior === null ? 'neutro' : Math.abs(calc.pior) > rc.authorizedStopDollar ? 'ruim' : 'bom'}
            acao={
              calc.pior === null
                ? 'Sem perda registrada, não há como aferir se o teu limite aguenta. O primeiro trade perdedor é o teste.'
                : Math.abs(calc.pior) > rc.authorizedStopDollar
                  ? 'Já perdeu mais do que autoriza hoje. Ou o limite está apertado demais para o teu jeito de operar, ou o stop não está sendo respeitado.'
                  : 'A tua pior perda cabe dentro do limite autorizado. É o sinal de que o dimensionamento está coerente.'
            }
          />
          <Metrica
            rotulo="Queda desde o topo"
            valor={`${calc.quedaAtual.toFixed(1)}%`}
            nota={`pior queda registrada: ${calc.quedaMax.toFixed(1)}%`}
            tom={calc.quedaAtual < -15 ? 'ruim' : calc.quedaAtual < -5 ? 'atencao' : 'bom'}
            acao="Medida sobre o capital real, com os aportes na data em que entraram. Queda funda pede tamanho menor até recuperar o topo."
          />
        </div>
      </div>

      {/* ── 2. Disciplina de stop ────────────────────────────── */}
      <PremiumCard className="p-6 space-y-3">
        <div className="flex items-start gap-3">
          {stopRespeitado
            ? <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            : <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
          <div className="space-y-1">
            <h2 className="font-semibold">Você respeita o próprio stop?</h2>
            {disciplina.avaliados === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum trade perdedor com stop registrado ainda. Preencha o campo de stop ao lançar
                — é o que permite comparar a perda planejada com a realizada.
              </p>
            ) : stopRespeitado ? (
              <p className="text-sm">
                Nos <strong>{disciplina.avaliados}</strong> trades perdedores com stop registrado,
                nenhum estourou o limite planejado. É a métrica mais difícil de manter e a que mais
                separa quem sobrevive.
              </p>
            ) : (
              <p className="text-sm">
                <strong className="text-amber-500">
                  {disciplina.estourados} de {disciplina.avaliados}
                </strong>{' '}
                trades perdedores fecharam com perda maior que o stop planejado
                {disciplina.piorEstouroPct !== null && (
                  <> — o pior deles custou <strong>{disciplina.piorEstouroPct.toFixed(0)}%</strong> além do previsto</>
                )}
                . Um stop que não é respeitado não é um stop, é uma intenção.
              </p>
            )}
          </div>
        </div>
      </PremiumCard>

      {/* ── 3. Risco por setup ───────────────────────────────── */}
      {setups.length > 0 && (
        <PremiumCard className="p-0 overflow-hidden">
          <div className="p-6 pb-3">
            <h2 className="font-semibold">Risco e retorno por setup</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Acerto alto com R:R baixo depende inteiramente do acerto se manter. É o padrão que
              quebra primeiro quando o mercado muda.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border/50 text-xs text-muted-foreground">
                  <th className="text-left font-medium px-6 py-2">Setup</th>
                  <th className="text-right font-medium px-3 py-2">Trades</th>
                  <th className="text-right font-medium px-3 py-2">Acerto</th>
                  <th className="text-right font-medium px-3 py-2">R:R</th>
                  <th className="text-right font-medium px-3 py-2">Alavancagem média</th>
                  <th className="text-right font-medium px-6 py-2">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {setups.map((s) => (
                  <tr key={s.setup} className="border-b border-border/20 last:border-0">
                    <td className="px-6 py-2.5 font-medium">{s.setup}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{s.trades}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{s.acerto.toFixed(0)}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {s.rr === null
                        ? <span className="text-muted-foreground" title="Sem trade perdedor ainda">—</span>
                        : s.rr.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                      {s.alavancagemMedia === null ? '—' : `${s.alavancagemMedia.toFixed(0)}x`}
                    </td>
                    <td className={`px-6 py-2.5 text-right tabular-nums ${s.liquido >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatAmount(s.liquido)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-border/40">
            <p className="text-[11px] text-muted-foreground">
              <strong>R:R —</strong> ganho médio dividido pela perda média. Um traço significa que o
              setup ainda não teve perda, então não há o que dividir. Com R:R abaixo de 1 o ponto de
              equilíbrio exige acerto acima de 50%, e sobe rápido conforme o R:R cai.
            </p>
          </div>
        </PremiumCard>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <Link to="/capital-management" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
          Extrato de aportes e retiradas <ArrowUpRight className="h-3 w-3" />
        </Link>
        <Link to="/trades" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
          Histórico completo de trades <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
