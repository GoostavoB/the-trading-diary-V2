import { useQuery } from '@tanstack/react-query';

/**
 * Os resultados do backtest são dados de referência globais — iguais para todo
 * mundo, atualizados uma vez por semana pelo job `scripts/bumerangue_weekly.py`.
 * Por isso vivem num JSON versionado em `public/data/`, não no banco: cada
 * rodada vira um commit, o que dá histórico auditável de graça e dispensa
 * tabela, RLS e migração.
 */

export type Bandeira = 'alta' | 'queda' | 'estavel' | 'novo';

export interface ResumoTF {
  trades: number;
  acerto: number;
  expectativa_r: number;
  sinais_por_mes: number;
  usd_media_mes: number;
  usd_mediana_mes: number;
  pior_mes: number;
  melhor_mes: number;
  meses_negativos: number;
  meses_total: number;
  celulas_operaveis: number;
}

export type EstadoRecente = 'esfriando' | 'esquentando' | 'em linha' | 'amostra curta';

export interface RecenteTF {
  dias: number;
  trades: number;
  acerto?: number;
  expectativa_r?: number;
  diferenca?: number;
  estado: EstadoRecente;
}

export interface AtivoTF {
  trades: number;
  acerto: number;
  expectativa_r: number;
  usd_total: number;
  bandeira?: { flag: Bandeira; delta: number | null };
  /**
   * Janela curta (180 dias) medida com o mesmo stop calibrado. É ela que mostra
   * o ativo esfriando ou esquentando agora — a base de 3 anos é estável demais
   * para acusar mudança de uma semana para a outra.
   */
  recente?: RecenteTF;
}

export interface EfeitoLSR {
  janela_dias: number;
  trades_cruzados: number;
  amostra_suficiente: boolean;
  sem_filtro: { trades: number; acerto: number; usd_por_trade: number };
  com_filtro: { trades: number; acerto: number; usd_por_trade: number };
  bloqueados: { trades: number; acerto: number; usd_por_trade: number };
}

export interface RodadaBacktest {
  setup: string;
  gerado_em: string;
  janela_dias: number;
  risco_por_trade_usd: number;
  ativos: number;
  timeframes: Record<string, {
    resumo: ResumoTF;
    ativos: Record<string, AtivoTF>;
    modos: Record<string, { SHORT: string; LONG: string }>;
    bandas: string[];
    stops: number[];
    tabela: Record<string, Record<string, Record<string, Record<string, unknown>>>>;
  }>;
  lsr: {
    atual: number | null;
    fonte: string;
    historico_dias: number;
    dias_novos_nesta_rodada?: number;
    limite_short: number;
    limite_long: number;
    serie: Record<string, number>;
    efeito: EfeitoLSR | null;
  };
  relatorio: {
    texto: string;
    positivas: string[];
    negativas: string[];
    observacoes: string[];
  };
  duracao_s: number;
}

export interface ArquivoBacktest {
  atual: RodadaBacktest;
  historico: Array<{
    gerado_em: string;
    lsr: number | null;
    [tf: string]: unknown;
  }>;
}

export function useBacktestData(setup = 'bumerangue') {
  return useQuery<ArquivoBacktest>({
    queryKey: ['backtest', setup],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch(`/data/${setup}-backtests.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Backtest data unavailable (HTTP ${res.status})`);
      return res.json();
    },
  });
}
