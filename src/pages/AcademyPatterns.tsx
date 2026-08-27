import React from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Repeat,
  Target,
  LogIn,
  Brain,
  Layers,
  Triangle,
} from 'lucide-react';
import {
  DoubleTop,
  TripleTop,
  HeadShoulders,
  Diamond,
  DirectionalTriangle,
  ChannelIntoLevel,
  RoundedBottom,
  Wedge,
  Flag,
  Pennant,
  Pivot,
  FalseBreak,
  SymmetricTriangle,
} from '@/components/academy/patternDiagrams';

type Pattern = {
  name: string;
  bias: 'bull' | 'bear';
  diagram: React.ReactNode;
  why: string;
  entry: string;
  target: string;
  riskWarning?: string;
};

const topPatterns: Pattern[] = [
  {
    name: 'Topo Duplo',
    bias: 'bear',
    diagram: <DoubleTop />,
    why: 'O preço testa uma resistência, é rejeitado, recua e volta a testar a mesma região — e falha de novo. O segundo teste mostra que o fluxo comprador já não consegue absorver a oferta parada ali. Quem comprou o repique fica preso, e a saída dessas posições vira o combustível da queda.',
    entry: 'Short na rejeição do segundo topo (mais agressivo) ou no rompimento do suporte entre os dois topos — o neckline (mais conservador).',
    target: 'Alvo 1: 50% da extensão do padrão (altura do topo até o neckline). Alvo 2: 100% da extensão.',
  },
  {
    name: 'Topo Triplo',
    bias: 'bear',
    diagram: <TripleTop />,
    why: 'A mesma lógica do topo duplo, com três toques. Cada rejeição adicional confirma que existe um vendedor grande defendendo aquele preço. Quanto mais toques, mais forte a zona — e mais gente comprada logo abaixo esperando o rompimento que nunca vem.',
    entry: 'Short no terceiro toque com rejeição, ou no rompimento do neckline.',
    target: 'Alvo 1: 50% da extensão. Alvo 2: 100% da extensão.',
  },
  {
    name: 'OCO — Ombro-Cabeça-Ombro',
    bias: 'bear',
    diagram: <HeadShoulders />,
    why: 'Numa tendência de alta, o mercado forma o ombro esquerdo, depois a cabeça (topo mais alto) e finalmente um ombro direito mais baixo. Esse topo mais baixo é a evidência objetiva: o comprador não conseguiu mais empurrar o preço para uma nova máxima. A força compradora acabou antes do preço cair.',
    entry: 'Short no rompimento do neckline — a linha que liga os dois vales entre ombros e cabeça.',
    target: 'Alvo 1: 50% da extensão (da cabeça até o neckline). Alvo 2: 100% da extensão.',
  },
  {
    name: 'Diamante no Topo',
    bias: 'bear',
    diagram: <Diamond />,
    why: 'Primeiro a volatilidade explode (topos mais altos e fundos mais baixos: indecisão e disputa), depois contrai (o mercado se acalma, mas em um nível esticado). A expansão mostra exaustão da tendência; a contração mostra que ninguém mais quer pagar mais caro. Quando quebra, quebra para o lado de quem ficou preso: os comprados.',
    entry: 'Short no rompimento da parte inferior do diamante.',
    target: 'Alvo 1: 50% da altura do diamante. Alvo 2: 100%.',
  },
  {
    name: 'Triângulo Descendente',
    bias: 'bear',
    diagram: <DirectionalTriangle />,
    why: 'Os topos vão ficando cada vez mais baixos enquanto o suporte se mantém plano. Isso significa que o vendedor aceita vender cada vez mais barato — tem pressa — enquanto o comprador defende sempre no mesmo preço. É uma parede sendo martelada: cada teste consome as ordens de compra empilhadas ali até não sobrar nada.',
    entry: 'Short no rompimento do suporte plano, preferencialmente com reteste pelo lado de baixo.',
    target: 'Projeção espelhada da altura do triângulo a partir do ponto de rompimento.',
  },
  {
    name: 'Canal de Alta em Resistência',
    bias: 'bear',
    diagram: <ChannelIntoLevel />,
    why: 'O preço sobe fazendo topos e fundos ascendentes dentro de um canal, mas chega numa resistência relevante. Ali a tendência de curto prazo encontra oferta de timeframe maior. Sinal extra de fraqueza: se a amplitude entre topos e fundos vai diminuindo (canal estreitando), o movimento já está perdendo força antes mesmo do rompimento — uma alta saudável mantém amplitude constante ou crescente.',
    entry: 'Short na perda da linha inferior do canal, dentro da zona de resistência.',
    target: 'Alvo 1: 50% da altura do canal. Alvo 2: base do canal / próximo suporte relevante.',
  },
];

const bottomPatterns: Pattern[] = [
  {
    name: 'Fundo Duplo',
    bias: 'bull',
    diagram: <DoubleTop flip />,
    why: 'Espelho do topo duplo. O preço testa um suporte, sobe, volta a testar e não consegue fazer nova mínima. O vendedor perdeu capacidade de empurrar o preço para baixo, e os vendidos passam a ser os pressionados.',
    entry: 'Long na formação do segundo fundo, ou no rompimento da resistência entre os dois fundos (neckline).',
    target: 'Alvo 1: 50% da extensão. Alvo 2: 100% da extensão.',
  },
  {
    name: 'Fundo Triplo',
    bias: 'bull',
    diagram: <TripleTop flip />,
    why: 'Três defesas do mesmo suporte. Cada defesa confirma um comprador grande posicionado naquele preço. Quanto mais toques, mais relevante a zona.',
    entry: 'Long no terceiro toque com rejeição, ou no rompimento do neckline.',
    target: 'Alvo 1: 50% da extensão. Alvo 2: 100% da extensão.',
  },
  {
    name: 'OCOI — Ombro-Cabeça-Ombro Invertido',
    bias: 'bull',
    diagram: <HeadShoulders flip />,
    why: 'Ombro esquerdo, cabeça (fundo mais baixo) e ombro direito mais alto. Esse fundo mais alto é a assinatura da perda de força vendedora — o vendedor não consegue mais levar o preço para uma nova mínima. Antecipa o pivô de alta.',
    entry: 'Long no rompimento do neckline — a linha que liga os dois picos entre ombros e cabeça.',
    target: 'Alvo 1: 50% da extensão (da cabeça até o neckline). Alvo 2: 100% da extensão.',
  },
  {
    name: 'Fundo Arredondado',
    bias: 'bull',
    diagram: <RoundedBottom />,
    why: 'Reversão gradual em formato de "U" ou cuia. Não há um evento único: o sentimento migra lentamente de vendedor para comprador, com a pressão de venda secando aos poucos. É típico de ativos esquecidos que começam a ser acumulados sem pressa.',
    entry: 'Long na confirmação do rompimento no fim da curva (a resistência formada pelo início da cuia).',
    target: 'Alvo 1: 50% da extensão da curva. Alvo 2: 100% da extensão.',
  },
  {
    name: 'Diamante no Fundo',
    bias: 'bull',
    diagram: <Diamond flip />,
    why: 'Espelho do diamante no topo: expansão de volatilidade (capitulação e disputa) seguida de contração. Quando a contração resolve para cima, os vendidos presos viram combustível da alta.',
    entry: 'Long no rompimento da parte superior do diamante.',
    target: 'Alvo 1: 50% da altura do diamante. Alvo 2: 100%.',
  },
  {
    name: 'Triângulo Ascendente',
    bias: 'bull',
    diagram: <DirectionalTriangle flip />,
    why: 'Fundos cada vez mais altos contra uma resistência plana. O comprador aceita pagar cada vez mais caro — tem pressa — enquanto o vendedor defende sempre o mesmo preço. A cada teste, as ordens de venda naquele nível vão sendo consumidas até romper.',
    entry: 'Long no rompimento da resistência plana, preferencialmente com reteste por cima.',
    target: 'Projeção espelhada da altura do triângulo a partir do rompimento.',
  },
  {
    name: 'Canal de Baixa em Suporte',
    bias: 'bull',
    diagram: <ChannelIntoLevel flip />,
    why: 'Espelho do canal de alta. O preço cai em canal ordenado até encontrar um suporte relevante de timeframe maior. Se a amplitude do canal vai estreitando, a queda já está sem força — o movimento vira mais realização do que venda agressiva.',
    entry: 'Long no rompimento da linha superior do canal, dentro da zona de suporte.',
    target: 'Alvo 1: 50% da altura do canal. Alvo 2: topo do canal / próxima resistência relevante.',
  },
];

const wedgePatterns: Pattern[] = [
  {
    name: 'Cunha Descendente',
    bias: 'bull',
    diagram: <Wedge />,
    why: 'As duas linhas de tendência caem e convergem: os fundos caem menos do que os topos. Ou seja, a venda está perdendo amplitude a cada perna. A volatilidade se estreita até o mercado precisar escolher um lado — e a probabilidade maior é romper para cima.',
    entry: 'Long no rompimento da linha superior da cunha.',
    target: 'Projeção da altura da parte mais larga da cunha a partir do rompimento. Pode romper para baixo em minoria dos casos — respeite o stop.',
  },
  {
    name: 'Cunha Ascendente',
    bias: 'bear',
    diagram: <Wedge flip />,
    why: 'Espelho: as duas linhas sobem e convergem. Cada nova perna de alta é menor que a anterior — o comprador está sem fôlego, comprando só por inércia. Probabilidade maior de romper para baixo.',
    entry: 'Short no rompimento da linha inferior da cunha.',
    target: 'Projeção da altura da parte mais larga da cunha a partir do rompimento.',
  },
];

const continuationPatterns: Pattern[] = [
  {
    name: 'Bandeira de Alta',
    bias: 'bull',
    diagram: <Flag />,
    why: 'Depois de um movimento impulsivo forte (o mastro), o preço consolida num canal pequeno e apertado contra a tendência. Não é venda de verdade: é realização parcial e entrada de novos compradores em preço melhor. O canal apertado mostra que ninguém quer vender barato — o mercado está apenas descansando.',
    entry: 'No rompimento do canal da bandeira, a favor do impulso original. Stop logo abaixo da bandeira — por isso o risco é pequeno.',
    target: 'Alvo 1 (conservador): altura da própria bandeira projetada do rompimento. Alvo 2 (completo): altura do mastro projetada do rompimento — é o que dá o risco/retorno excelente.',
  },
  {
    name: 'Bandeira de Baixa',
    bias: 'bear',
    diagram: <Flag flip />,
    why: 'Espelho exato em tendência de queda: impulso vendedor forte, depois um canal estreito subindo devagar. Quem tenta comprar o fundo fornece liquidez para o vendedor reposicionar.',
    entry: 'Short no rompimento da parte inferior do canal da bandeira.',
    target: 'Alvo 1: altura da bandeira. Alvo 2: altura do mastro projetada do rompimento.',
  },
  {
    name: 'Flâmula de Alta',
    bias: 'bull',
    diagram: <Pennant />,
    why: 'Igual à bandeira, mas a consolidação converge num triangulozinho simétrico em vez de um canal paralelo (às vezes com uma leve curvatura, tipo colherzinha). A convergência mostra compressão: compradores e vendedores vão apertando o spread até o impulso retomar.',
    entry: 'No rompimento da flâmula, a favor do mastro.',
    target: 'Alvo 1: altura da consolidação. Alvo 2: altura do mastro projetada do rompimento.',
  },
  {
    name: 'Flâmula de Baixa',
    bias: 'bear',
    diagram: <Pennant flip />,
    why: 'Espelho em tendência de queda: impulso forte para baixo, consolidação convergente e retomada da queda.',
    entry: 'Short no rompimento da flâmula, a favor do mastro.',
    target: 'Alvo 1: altura da consolidação. Alvo 2: altura do mastro.',
  },
];

function PatternCard({ p }: { p: Pattern }) {
  const isBull = p.bias === 'bull';
  return (
    <PremiumCard className="p-5" contentClassName="p-0">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">{p.name}</h3>
          <Badge
            variant="outline"
            className={
              isBull
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px]'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400 text-[11px]'
            }
          >
            {isBull ? 'Viés de alta' : 'Viés de baixa'}
          </Badge>
        </div>

        {p.diagram}

        <div className="space-y-3">
          <div className="flex gap-2.5">
            <Brain className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">Por que acontece</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">{p.why}</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <LogIn className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">Entrada</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">{p.entry}</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Target className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">Alvo</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">{p.target}</p>
            </div>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-l-4 border-indigo-500 pl-4 flex items-start gap-3">
      <Icon className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">{subtitle}</p>
      </div>
    </div>
  );
}

export default function AcademyPatterns() {
  return (
    <>
      <SEO
        title="Padrões Gráficos — Reversão e Continuação | Academy"
        description="Lição completa de padrões gráficos: topo/fundo duplo e triplo, OCO e OCOI, diamantes, triângulos, cunhas, bandeiras e flâmulas — com a lógica de fluxo de ordens, regra de entrada e alvos."
        canonical="https://www.thetradingdiary.com/learn/chart-patterns"
        noindex={true}
      />
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-10 pb-16">
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Academy
          </Link>

          {/* Hero */}
          <PremiumCard className="p-6 lg:p-8" contentClassName="p-0">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-md">
                <Layers className="h-3.5 w-3.5" />
                Módulo 1 · Academy
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Padrões gráficos: a lógica por trás da forma
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Um padrão não funciona porque desenha bonito. Funciona porque descreve o que compradores e vendedores
                estão fazendo naquela região. Nesta lição você vê cada formação de reversão e continuação com o
                diagrama, a explicação de fluxo de ordens, a regra de entrada e os alvos.
              </p>
            </div>
          </PremiumCard>

          {/* Callout de manipulação */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-amber-300">
                  Antes de operar qualquer padrão, leia isto: rompimento falso e manipulação
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Padrões gráficos são amplamente conhecidos — e é justamente isso que os torna alvo. Todo mundo coloca
                  stop no mesmo lugar óbvio, e esse aglomerado de stops é liquidez. É muito comum o mercado romper
                  primeiro na direção "errada", capturar esses stops, e só depois fazer o movimento real.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Isso é <strong className="text-foreground">especialmente comum</strong> quando o padrão ocorre numa
                  região que também é suporte ou resistência diário/semanal. Quanto mais relevante o nível, maior a
                  chance de manipulação antes do movimento verdadeiro.
                </p>
                <p className="text-sm text-amber-200/90 leading-relaxed">
                  Regra prática: se o padrão não estiver apoiado por um suporte/resistência de timeframe maior
                  (diário ou semanal), confiar no rompimento cru é mais arriscado. Analise o contexto antes — o padrão
                  é o gatilho, não a tese.
                </p>
              </div>
            </div>
            <div className="mt-5 max-w-md">
              <FalseBreak />
            </div>
          </div>

          {/* Conceitos gerais */}
          <section className="space-y-4">
            <SectionHeading
              icon={Brain}
              title="Dois conceitos que valem para todos os padrões"
              subtitle="Antes das formações, dois blocos fundamentais que se repetem em tudo que vem a seguir."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <PremiumCard className="p-5" contentClassName="p-0">
                <h3 className="text-base font-semibold mb-2">A entrada é sempre no rompimento da formação</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nos padrões de reversão, a entrada válida é no topo ou no fundo da formação, no rompimento do nível
                  que estrutura o padrão (neckline, suporte plano, linha do canal). Antes disso o padrão ainda é uma
                  hipótese: nada garante que o preço não vá fazer mais um teste.
                </p>
              </PremiumCard>
              <PremiumCard className="p-5" contentClassName="p-0">
                <h3 className="text-base font-semibold mb-2">Pivô: o bloco básico de qualquer padrão</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Um pivô é um movimento de impulso seguido de um recuo. Cada topo, cada fundo e cada ombro de um
                  padrão é um pivô. Aprender a marcar pivôs é o que permite enxergar as formações em tempo real, em
                  vez de reconhecê-las só depois de prontas.
                </p>
                <Pivot />
              </PremiumCard>
            </div>
          </section>

          {/* Reversão */}
          <section className="space-y-6">
            <SectionHeading
              icon={Repeat}
              title="Padrões de reversão"
              subtitle="Formações que sinalizam o fim de um movimento. Cada padrão de topo tem um espelho exato no fundo — mesma lógica, direção invertida."
            />

            <div className="flex items-center gap-2 pt-2">
              <TrendingDown className="h-4 w-4 text-rose-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-400">No topo — viés de baixa</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {topPatterns.map((p) => (
                <PatternCard key={p.name} p={p} />
              ))}
            </div>

            <div className="flex items-center gap-2 pt-4">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                No fundo — viés de alta (espelho de cada padrão acima)
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {bottomPatterns.map((p) => (
                <PatternCard key={p.name} p={p} />
              ))}
            </div>
          </section>

          {/* Cunhas */}
          <section className="space-y-5">
            <SectionHeading
              icon={Triangle}
              title="Cunhas"
              subtitle="Duas linhas convergentes na mesma direção. A convergência estreita a volatilidade e cria um viés probabilístico contrário à inclinação da cunha."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {wedgePatterns.map((p) => (
                <PatternCard key={p.name} p={p} />
              ))}
            </div>
          </section>

          {/* Continuação */}
          <section className="space-y-5">
            <SectionHeading
              icon={Layers}
              title="Padrões de continuação"
              subtitle="Pausas dentro de uma tendência. O preço não reverte — apenas descansa antes de continuar. São os padrões com melhor risco/retorno, porque o stop fica curto e o alvo é o tamanho do impulso anterior."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {continuationPatterns.map((p) => (
                <PatternCard key={p.name} p={p} />
              ))}
            </div>
          </section>

          <PremiumCard className="p-5" contentClassName="p-0">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Este módulo continua sendo expandido. Próximas adições: padrões de continuação adicionais, retângulos,
              triângulos simétricos em tendência e exemplos aplicados aos seus próprios trades.
            </p>
          </PremiumCard>
        </div>
      </AppLayout>
    </>
  );
}
