import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info, Landmark, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAccount } from '@/contexts/SubAccountContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { calcularBalanceamento, TRAVA_STOP_PADRAO } from '@/lib/surplusEngine';

interface Props {
  /** Capital consolidado — conta de trade mais o que estiver fora dela. */
  capitalTotal: number;
  /** Percentuais dos perfis de risco configurados. */
  perfisPct: number[];
  /** Nome do perfil mais agressivo, só para dizer quem manda no número. */
  nomeMaiorPerfil?: string;
}

/**
 * Quanto do capital fica exposto na corretora.
 *
 * O dimensionamento é o do blueprint: a conta de trade guarda o suficiente para
 * que uma perda na trava de 70% custe exatamente o risco do perfil mais
 * agressivo, e o resto sai de alcance.
 *
 * Duas coisas que a fórmula sozinha não conta e que o painel mostra junto:
 * a trava de 70% é regra de dimensionamento do usuário e não um limite que a
 * corretora respeite — numa liquidação a conta de trade vai inteira; e o
 * limite calculado costuma ser menor que a margem que os trades reais usaram,
 * o que torna a regra inaplicável até que o tamanho das posições ou o perfil
 * mudem. Sem esses dois avisos o painel promete uma proteção que não existe.
 */
export function AccountBalancingPanel({ capitalTotal, perfisPct, nomeMaiorPerfil }: Props) {
  const { user } = useAuth();
  const { activeSubAccount } = useSubAccount();
  const { formatAmount } = useCurrency();
  const [saldoTexto, setSaldoTexto] = useState('');

  const saldoTradeAtual = saldoTexto.trim() === ''
    ? capitalTotal
    : Math.max(0, parseFloat(saldoTexto.replace(',', '.')) || 0);

  const r = useMemo(
    () => calcularBalanceamento({ capitalTotal, perfisPct, saldoTradeAtual }),
    [capitalTotal, perfisPct, saldoTradeAtual],
  );

  // A maior margem já comprometida num único trade. É o teste de realidade da
  // regra: se ela não cabe na conta dimensionada, a regra não vale como está.
  const { data: maiorMargem } = useQuery({
    queryKey: ['balanceamento-maior-margem', user?.id, activeSubAccount?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('symbol, margin, position_size, entry_price, leverage')
        .eq('user_id', user!.id)
        .eq('sub_account_id', activeSubAccount!.id)
        .is('deleted_at', null);
      if (error) throw error;

      let topo: { symbol: string; margem: number } | null = null;
      for (const t of data || []) {
        // Prefere a margem gravada; se faltar, deriva de quantidade x preço
        // sobre a alavancagem, que é como o resto do app faz a conta.
        const gravada = Number(t.margin) || 0;
        const qtd = Number(t.position_size) || 0;
        const entrada = Number(t.entry_price) || 0;
        const alav = Number(t.leverage) || 1;
        const margem = gravada > 0 ? gravada : (qtd > 0 && entrada > 0 ? (qtd * entrada) / alav : 0);
        if (margem > 0 && (!topo || margem > topo.margem)) {
          topo = { symbol: t.symbol || 'trade', margem };
        }
      }
      return topo;
    },
    enabled: !!user?.id && !!activeSubAccount?.id,
  });

  if (r.maiorRiscoPct <= 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Sem perfil de risco configurado não dá para dimensionar a conta de trade. Crie um perfil
        acima e este bloco passa a dizer quanto deixar exposto.
      </div>
    );
  }

  const naoCabe = !!maiorMargem && maiorMargem.margem > r.contaDeTrade;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <Label className="text-sm font-semibold">Balanceamento da conta</Label>
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ditado pelo teu perfil mais agressivo
          {nomeMaiorPerfil ? <> — <span className="font-semibold text-foreground">{nomeMaiorPerfil}</span></> : null}
          {' '}({r.maiorRiscoPct.toFixed(1)}%), que autoriza arriscar{' '}
          <span className="font-mono font-semibold text-foreground">{formatAmount(r.riscoMaximo)}</span>.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-background/40 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <Landmark className="h-3 w-3" /> Conta de trade
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums">{formatAmount(r.contaDeTrade)}</div>
            <div className="text-[11px] text-muted-foreground">é só isto que fica exposto</div>
          </div>
          <div className="rounded-xl border border-apple-green/30 bg-apple-green/5 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> Fundo protegido
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-apple-green">
              {formatAmount(r.fundoProtegido)}
            </div>
            <div className="text-[11px] text-muted-foreground">fora de alcance de qualquer trade</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="saldo-trade" className="text-xs text-muted-foreground">
            Quanto está hoje na conta de trade?
          </Label>
          <Input
            id="saldo-trade"
            inputMode="decimal"
            placeholder={capitalTotal.toFixed(2)}
            value={saldoTexto}
            onChange={(e) => setSaldoTexto(e.target.value)}
            className="font-mono h-9"
          />
          <p className="text-[11px] text-muted-foreground">
            Em branco assume que o capital inteiro está lá.
          </p>
        </div>

        {r.precisaTransferir ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Para operar até {r.maiorRiscoPct.toFixed(1)}%, deixe{' '}
              <span className="font-mono font-semibold">{formatAmount(r.contaDeTrade)}</span> na conta de
              trade e transfira{' '}
              <span className="font-mono font-semibold">{formatAmount(r.excedente)}</span> para o fundo.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-apple-green/30 bg-apple-green/5 p-3 text-xs leading-relaxed">
            A conta de trade está dentro do limite. Nada a transferir.
          </div>
        )}

        {naoCabe && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 flex gap-2.5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-destructive">Esta regra não cabe nos teus trades de hoje.</p>
              <p>
                A maior margem que você já comprometeu num trade foi{' '}
                <span className="font-mono font-semibold">{formatAmount(maiorMargem!.margem)}</span>
                {' '}({maiorMargem!.symbol}) — {(maiorMargem!.margem / r.contaDeTrade).toFixed(1)}× o que
                esta conta comportaria. Com o balanceamento ligado, esse trade não teria margem para abrir.
              </p>
              <p className="text-muted-foreground">
                Ou as posições encolhem, ou o perfil de {r.maiorRiscoPct.toFixed(1)}% não descreve como
                você opera de verdade. Decidir isso é mais importante que transferir o dinheiro.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1 border-t border-border/50">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            A trava de {(TRAVA_STOP_PADRAO * 100).toFixed(0)}% é uma regra sua de dimensionamento, não um
            limite que a corretora respeite. Numa liquidação a conta de trade vai inteira:{' '}
            <span className="font-mono">{formatAmount(r.perdaEmLiquidacaoTotal)}</span>, não{' '}
            <span className="font-mono">{formatAmount(r.riscoMaximo)}</span>. O que o fundo protege é o
            resto — e isso ele protege de verdade.
          </p>
        </div>
      </div>
    </div>
  );
}
