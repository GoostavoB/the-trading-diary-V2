import { PremiumCard } from "@/components/ui/PremiumCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingDown, Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DrawdownChartProps {
  data: Array<{
    date: string;
    equity: number;
    peak: number;
    drawdown: number;
  }>;
  maxDrawdown: number;
  currentDrawdown: number;
}

/** Severidade da queda. Define a cor — e a cor só aparece quando ela significa algo. */
type Nivel = 'ok' | 'atencao' | 'grave';

function nivelDe(quedaPct: number): Nivel {
  if (quedaPct <= -10) return 'grave';
  if (quedaPct <= -5) return 'atencao';
  return 'ok';
}

const COR_NUMERO: Record<Nivel, string> = {
  ok: 'text-foreground',
  atencao: 'text-apple-orange',
  grave: 'text-apple-red',
};

const COR_TRILHO: Record<Nivel, string> = {
  ok: 'bg-border',
  atencao: 'bg-apple-orange',
  grave: 'bg-apple-red',
};

/**
 * Um número com a régua do que ele significa.
 *
 * O fundo é sempre neutro. A cor vive no algarismo e no trilho da esquerda, e
 * só acende quando o número piora — antes os três cards tinham fundo saturado
 * e texto vermelho por cima, o que deixava ilegível e ainda dizia duas coisas
 * opostas ao mesmo tempo (vermelho de alerta sobre verde de tudo bem).
 */
function Metrica({
  rotulo,
  valor,
  nivel = 'ok',
  legenda,
}: {
  rotulo: string;
  valor: string;
  nivel?: Nivel;
  legenda: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20 p-4 pl-5">
      <div className={cn('absolute left-0 inset-y-0 w-[3px]', COR_TRILHO[nivel])} />
      <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{rotulo}</div>
      <div className={cn('mt-1.5 text-3xl font-bold font-mono tabular-nums', COR_NUMERO[nivel])}>{valor}</div>
      <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{legenda}</div>
    </div>
  );
}

const formatarData = (iso: string) => {
  const [, m, d] = String(iso).split('-');
  return d && m ? `${d}/${m}` : String(iso);
};

export function DrawdownChart({ data, maxDrawdown, currentDrawdown }: DrawdownChartProps) {
  const nivelAtual = nivelDe(currentDrawdown);
  const nivelMaximo = nivelDe(maxDrawdown);

  // Quanto é preciso subir para voltar ao topo. A assimetria é o ponto: cair
  // 20% exige subir 25%, cair 50% exige subir 100%.
  const recuperacao = currentDrawdown < 0
    ? Math.abs((100 / (100 + currentDrawdown) - 1) * 100)
    : 0;

  // Nunca caiu do topo: não há série para desenhar. Antes o gráfico montava
  // eixos de 0 a 4 sobre uma linha de zeros e repetia a mesma data quatro
  // vezes — parecia defeito, e escondia a informação de que está tudo bem.
  const nuncaCaiu = maxDrawdown === 0;

  const piso = Math.min(-10, Math.floor(maxDrawdown / 5) * 5);

  return (
    <PremiumCard className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <TrendingDown className={cn('h-5 w-5', nivelAtual === 'ok' ? 'text-muted-foreground' : COR_NUMERO[nivelAtual])} />
        <h2 className="text-lg font-semibold tracking-tight">Queda desde o topo</h2>
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs leading-relaxed">
                Distância entre o teu capital hoje e o maior valor que ele já teve. É o único número
                de risco que não depende de você lembrar de anotar nada.
              </p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Metrica
          rotulo="Agora"
          valor={`${currentDrawdown.toFixed(2)}%`}
          nivel={nivelAtual}
          legenda={currentDrawdown < 0 ? 'abaixo do teu topo histórico' : 'você está no topo histórico'}
        />
        <Metrica
          rotulo="Pior queda"
          valor={`${maxDrawdown.toFixed(2)}%`}
          nivel={nivelMaximo}
          legenda={nuncaCaiu ? 'o capital nunca recuou' : 'a maior já registrada'}
        />
        <Metrica
          rotulo="Para voltar ao topo"
          valor={`+${recuperacao.toFixed(2)}%`}
          nivel={recuperacao >= 11 ? 'atencao' : 'ok'}
          legenda={recuperacao > 0 ? 'sobre o capital de hoje' : 'nada a recuperar'}
        />
      </div>

      {nuncaCaiu ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/10 px-5 py-8 text-center">
          <p className="text-sm text-foreground">Teu capital nunca caiu do topo.</p>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Não há curva para desenhar ainda — ela aparece no primeiro trade que fechar no vermelho.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="gradQueda" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--apple-red))" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="hsl(var(--apple-red))" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              {/* Só linhas horizontais: as verticais pontilhadas viravam uma
                  grade de caderno atrás de uma série de três pontos. */}
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatarData}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                dy={6}
              />
              <YAxis
                domain={[piso, 0]}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  const linhas: Array<[string, string, string?]> = [
                    ['Capital', `$${p.equity.toFixed(2)}`],
                    ['Topo', `$${p.peak.toFixed(2)}`],
                    ['Queda', `${p.drawdown.toFixed(2)}%`, p.drawdown < 0 ? 'text-apple-red' : 'text-muted-foreground'],
                  ];
                  return (
                    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm px-3 py-2.5 shadow-xl">
                      <p className="text-[11px] font-mono text-muted-foreground mb-1.5">{formatarData(p.date)}</p>
                      <div className="space-y-1">
                        {linhas.map(([rotulo, valor, cor]) => (
                          <div key={rotulo} className="flex justify-between gap-6 text-xs">
                            <span className="text-muted-foreground">{rotulo}</span>
                            <span className={cn('font-mono tabular-nums font-medium', cor)}>{valor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={-10}
                stroke="hsl(var(--apple-red))"
                strokeOpacity={0.4}
                strokeDasharray="4 4"
                label={{
                  value: 'limite -10%',
                  position: 'insideBottomRight',
                  fontSize: 10,
                  fill: 'hsl(var(--apple-red))',
                  opacity: 0.7,
                }}
              />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="hsl(var(--apple-red))"
                strokeWidth={2}
                fill="url(#gradQueda)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--apple-red))' }}
                /* O recharts anima revelando a curva por um clipPath que cresce.
                   Em aba de fundo o navegador estrangula o requestAnimationFrame
                   e o clip para no meio: o grafico fica com os eixos certos e
                   nenhuma linha. Numa curva de perda a animacao nao acrescenta
                   nada, entao sai. */
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Uma frase que sai do número, no lugar da lista de conselhos genéricos
          que dizia "mantenha a disciplina" independentemente do que estivesse
          acontecendo — e que por isso não era lida nem quando importava. */}
      <div className="mt-4 flex gap-2.5 rounded-xl border border-border bg-muted/20 p-4">
        <div className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', COR_TRILHO[nivelAtual])} />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {nivelAtual === 'grave' ? (
            <>
              Queda de {Math.abs(currentDrawdown).toFixed(1)}%. Para voltar ao topo você precisa de{' '}
              <span className="font-mono font-semibold text-foreground">+{recuperacao.toFixed(1)}%</span> —
              recuperar sempre custa mais do que caiu. Corte o tamanho pela metade até a curva virar.
            </>
          ) : nivelAtual === 'atencao' ? (
            <>
              Queda de {Math.abs(currentDrawdown).toFixed(1)}%, ainda dentro do normal. Repare se ela veio
              de um trade grande ou de vários pequenos: são problemas diferentes.
            </>
          ) : nuncaCaiu ? (
            <>
              Sem queda para analisar. Este bloco passa a valer quando houver perda — até lá o número
              honesto é zero, não uma leitura otimista.
            </>
          ) : currentDrawdown === 0 ? (
            <>
              Você está no topo histórico. A pior queda até aqui foi{' '}
              <span className="font-mono font-semibold text-foreground">{maxDrawdown.toFixed(1)}%</span> —
              é essa a régua para saber se a próxima é normal ou não.
            </>
          ) : (
            <>
              {Math.abs(currentDrawdown).toFixed(1)}% abaixo do topo — ruído, não drawdown. A régua é a
              pior queda já registrada:{' '}
              <span className="font-mono font-semibold text-foreground">{maxDrawdown.toFixed(1)}%</span>.
            </>
          )}
        </p>
      </div>
    </PremiumCard>
  );
}
