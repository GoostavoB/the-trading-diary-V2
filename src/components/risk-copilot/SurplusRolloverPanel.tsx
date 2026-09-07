import { useEffect, useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock, TrendingUp, Wallet } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  calcularCiclo,
  percentualDoRisco,
  riscoDoPercentual,
  PRESETS_ROLAGEM,
  TRAVA_STOP_PADRAO,
  type ResultadoCiclo,
} from '@/lib/surplusEngine';

interface Props {
  saldoAtual: number;
  meta: number;
  travaStop?: number;
  /** Chamado a cada mudança, para quem quiser reagir ao vivo. */
  onChange?: (r: ResultadoCiclo) => void;
}

/**
 * Escolha de quanto do surplus vai para risco no próximo ciclo.
 *
 * Mostra os três números que importam ao mesmo tempo — risco autorizado, banca
 * da conta de trade e valor blindado — porque eles se movem juntos e ver um só
 * dá a impressão errada do que está acontecendo com o capital.
 */
export function SurplusRolloverPanel({ saldoAtual, meta, travaStop = TRAVA_STOP_PADRAO, onChange }: Props) {
  const { formatAmount } = useCurrency();
  const surplus = Math.max(0, saldoAtual - meta);
  const [risco, setRisco] = useState(0);
  const [texto, setTexto] = useState('0');

  const r = useMemo(
    () => calcularCiclo({ saldoAtual, meta, riscoAutorizado: risco, travaStop }),
    [saldoAtual, meta, risco, travaStop],
  );

  useEffect(() => { onChange?.(r); }, [r, onChange]);

  const pct = percentualDoRisco(surplus, risco);

  const aplicar = (valor: number) => {
    const v = Math.min(Math.max(valor, 0), surplus);
    setRisco(v);
    setTexto(v.toFixed(2));
  };

  if (surplus <= 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        O ciclo fechou sem surplus — não há excedente para rolar. O próximo ciclo começa com o
        capital como está.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Surplus do ciclo</div>
        <div className="text-2xl font-semibold tabular-nums">{formatAmount(surplus)}</div>
        <div className="text-xs text-muted-foreground mt-1 tabular-nums">
          {formatAmount(saldoAtual)} de saldo − {formatAmount(meta)} de meta
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Quanto disso você autoriza arriscar no próximo ciclo?
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS_ROLAGEM.map((p) => (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={Math.abs(pct - p) < 0.5 ? 'default' : 'outline'}
              onClick={() => aplicar(riscoDoPercentual(surplus, p))}
            >
              {p}%
            </Button>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">ou</span>
            <Input
              className="w-32 tabular-nums"
              inputMode="decimal"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                const n = parseFloat(e.target.value.replace(',', '.'));
                if (Number.isFinite(n)) setRisco(Math.min(Math.max(n, 0), surplus));
              }}
              onBlur={() => aplicar(risco)}
            />
          </div>
        </div>

        <Slider
          value={[pct]}
          onValueChange={(v) => aplicar(riscoDoPercentual(surplus, v[0]))}
          min={0}
          max={100}
          step={1}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Risco autorizado
          </div>
          <div className="text-lg font-semibold tabular-nums">{formatAmount(r.riscoAutorizado)}</div>
          <div className="text-xs text-muted-foreground">o máximo que você aceita perder</div>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" /> Conta de trade
          </div>
          <div className="text-lg font-semibold tabular-nums">{formatAmount(r.saldoTrade)}</div>
          <div className="text-xs text-muted-foreground">
            risco ÷ {(travaStop * 100).toFixed(0)}%
          </div>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Blindado no cofre
          </div>
          <div className="text-lg font-semibold tabular-nums">{formatAmount(r.saldoCofre)}</div>
          <div className="text-xs text-muted-foreground">fora de qualquer operação</div>
        </div>
      </div>

      {/* Os dois avisos que a fórmula sozinha não dá, e que mudam a leitura. */}
      <div className="space-y-2">
        {r.cofreAbaixoDaMeta && (
          <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong>O cofre ficou {formatAmount(r.faltaNoCofre)} abaixo da meta.</strong> Com
              rollover alto a conta de trade precisa de mais dinheiro do que o surplus inteiro, então
              parte da meta vai junto como colateral. Não sumiu: se o stop for respeitado, você
              termina o ciclo de volta em {formatAmount(saldoAtual - r.perdaPlanejada)}, no nível
              da meta ou acima.
            </div>
          </div>
        )}
        {r.riscoAutorizado > 0 && (
          <div className="flex gap-2 rounded-lg border border-border/60 p-3">
            <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              Perder exatamente {formatAmount(r.perdaPlanejada)} depende de o stop de{' '}
              {(travaStop * 100).toFixed(0)}% ser respeitado em toda posição. Numa liquidação da
              conta inteira — gap, slippage ou alavancagem acima da regra — a perda vai até{' '}
              <strong>{formatAmount(r.perdaEmLiquidacaoTotal)}</strong>. O cofre continua intocado
              nos dois casos, desde que esteja em conta separada.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
