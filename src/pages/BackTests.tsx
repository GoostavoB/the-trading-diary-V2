import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/components/ui/badge';
import { Activity, ArrowRight, Clock, FlaskConical } from 'lucide-react';
import { useBacktestData } from '@/hooks/useBacktestData';

/**
 * Índice dos backtests. Hoje só o Bumerangue; a lista cresce conforme novos
 * setups entram. Cada entrada aponta para o seu próprio dashboard.
 */
const BACKTESTS = [
  {
    slug: 'bumerangue',
    nome: 'Dashboard Bumerangue',
    descricao:
      'Reversão à média na EMA20, calibrada por ativo, lado e faixa de distância. Roda em 4H e 6H.',
    ativo: true,
  },
];

export default function BackTests() {
  const { data } = useBacktestData('bumerangue');
  const atual = data?.atual;

  const atualizadoEm = atual
    ? new Date(atual.gerado_em).toLocaleDateString(undefined, {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : null;

  return (
    <AppLayout>
      <SEO
        title="Back Tests"
        description="Backtests dos setups, atualizados semanalmente com dados novos de mercado."
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Back Tests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada setup do laboratório ganha aqui um backtest próprio, refeito toda semana com
            dados novos de mercado. O que muda de uma semana para a outra fica marcado.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {BACKTESTS.map((bt) => (
            <Link key={bt.slug} to={`/back-tests/${bt.slug}`} className="group">
              <PremiumCard className="p-6 h-full flex flex-col gap-3 transition-colors group-hover:border-primary/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-primary shrink-0" />
                    <h2 className="font-semibold">{bt.nome}</h2>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1" />
                </div>

                <p className="text-sm text-muted-foreground flex-1">{bt.descricao}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {atual && bt.slug === 'bumerangue' && (
                    <>
                      <Badge variant="secondary">4H · {atual.timeframes['4H']?.resumo.acerto}%</Badge>
                      <Badge variant="secondary">6H · {atual.timeframes['6H']?.resumo.acerto}%</Badge>
                    </>
                  )}
                  {atualizadoEm && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {atualizadoEm}
                    </span>
                  )}
                </div>
              </PremiumCard>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
