import React from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import {
  PivoAlta,
  TopoDuplo,
  FundoDuplo,
  TopoTriplo,
  FundoTriplo,
  OCO,
  OCOI,
  Diamante,
  FundoArredondado,
  TrianguloAscendente,
  TrianguloDescendente,
  TrianguloSimetrico,
  CanalAlta,
  CanalBaixa,
  CanalAltaEmResistencia,
  CanalBaixaEmSuporte,
  CunhaAscendente,
  CunhaDescendente,
  BandeiraAlta,
  BandeiraBaixa,
  FlamulaAlta,
  FlamulaBaixa,
  FalsoRompimento,
  FalsoRompimentoTriangulo,
  PullbackSuportePlano,
  PullbackFibo,
  EspelhamentoCanal,
  EspelhamentoSucessivo,
  FibRetracaoQueda,
  FibRetracaoAlta,
  FibExtensaoAlta,
  FibExtensaoQueda,
} from '@/components/academy/mockupDiagrams';

/* ------------------------------------------------------------------ tokens */

const C = {
  page: '#08080b',
  card: '#15151c',
  purple: '#8f8ff0',
  purpleSoft: '#c2c4fb',
  green: '#34d399',
  red: '#f87171',
  teal: '#2dd4bf',
  amber: '#f5b93b',
  text: '#f2f1f5',
  body: '#c2c0cb',
  legend: '#d7d6de',
  grid: '#5f5d70',
};

const FONT = "'Space Grotesk', Inter, system-ui, sans-serif";

type Category = 'Reversão' | 'Continuação' | 'Ferramentas';
type Bias = 'Long' | 'Short' | 'Alta' | 'Queda';

const catColor: Record<Category, string> = {
  'Reversão': C.purple,
  'Continuação': C.teal,
  'Ferramentas': C.amber,
};

const biasColor: Record<Bias, string> = {
  Long: C.green,
  Alta: C.green,
  Short: C.red,
  Queda: C.red,
};

function hexToRgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 16,
        fontWeight: 600,
        padding: '7px 16px',
        borderRadius: 999,
        background: hexToRgba(color, 0.14),
        color,
      }}
    >
      {label}
    </span>
  );
}

type LegendItem = { text: string; color?: string; kind?: 'dash' | 'square' | 'dot' | 'none' };

function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px', marginTop: 16 }}>
      {items.map((it) => {
        const color = it.color || C.legend;
        const kind = it.kind || (it.color ? 'square' : 'none');
        return (
          <span
            key={it.text}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color }}
          >
            {kind === 'dash' && (
              <i style={{ width: 20, height: 0, borderTop: `2.5px dashed ${it.color || C.grid}`, display: 'inline-block' }} />
            )}
            {kind === 'square' && (
              <i style={{ width: 12, height: 12, borderRadius: 3, background: color, display: 'inline-block' }} />
            )}
            {kind === 'dot' && (
              <i style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'inline-block' }} />
            )}
            {it.text}
          </span>
        );
      })}
    </div>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 18, lineHeight: 1.75, color: C.body, margin: '16px 0 0' }}>{children}</p>;
}

function Field({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          color,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <p style={{ fontSize: 18, lineHeight: 1.7, color: C.body, margin: 0 }}>{children}</p>
    </div>
  );
}

function TargetsBox({ title, color, chips, note }: { title: string; color: string; chips?: string[]; note?: string }) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: '16px 20px',
        borderRadius: 12,
        background: hexToRgba(color, 0.08),
        border: `1px solid ${hexToRgba(color, 0.25)}`,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {chips && (
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', fontSize: 19, fontWeight: 600, color: C.text }}>
          {chips.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      )}
      {note && <div style={{ fontSize: 18, fontWeight: 500, color: C.text }}>{note}</div>}
    </div>
  );
}

function Callout({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: '16px 20px',
        borderRadius: 12,
        background: hexToRgba(color, 0.08),
        border: `1px solid ${hexToRgba(color, 0.25)}`,
        fontSize: 17,
        lineHeight: 1.7,
        color: hexToRgba(color, 1),
      }}
    >
      {children}
    </div>
  );
}

function Card({
  category,
  bias,
  title,
  diagram,
  legend,
  children,
}: {
  category?: Category;
  bias?: Bias;
  title: string;
  diagram: React.ReactNode;
  legend?: LegendItem[];
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: C.card,
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 26,
        marginBottom: 24,
      }}
    >
      {(category || bias) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {category && <Chip label={category} color={catColor[category]} />}
          {bias && <Chip label={bias} color={biasColor[bias]} />}
        </div>
      )}
      <div style={{ fontSize: 30, fontWeight: 600, marginBottom: 20, color: C.text }}>{title}</div>
      {diagram}
      {legend && <Legend items={legend} />}
      {children}
    </div>
  );
}

function SectionTitle({ category, title, subtitle }: { category: Category; title: string; subtitle?: string }) {
  return (
    <div style={{ marginTop: 34, marginBottom: 14 }}>
      <Chip label={category} color={catColor[category]} />
      <h2 style={{ fontSize: 34, fontWeight: 600, margin: '18px 0 0', color: C.text }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 18, color: C.body, margin: '8px 0 0', maxWidth: 900 }}>{subtitle}</p>}
    </div>
  );
}

const legNeckline: LegendItem[] = [
  { text: 'Neckline', kind: 'dash' },
  { text: 'Seta replicada = alvo', color: C.purple },
];

/* -------------------------------------------------------------------- page */

export default function AcademyPatterns() {
  return (
    <>
      <SEO
        title="Padrões Gráficos — Reversão e Continuação | Academy"
        description="Lição completa de padrões gráficos: topo/fundo duplo e triplo, OCO e OCOI, diamantes, triângulos, cunhas, bandeiras, flâmulas e Fibonacci — com lógica de fluxo de ordens, entrada e alvos."
        canonical="https://www.thetradingdiary.com/learn/chart-patterns"
        noindex={true}
      />
      <AppLayout>
        <div style={{ fontFamily: FONT, background: C.page, color: C.text, margin: '-1rem', padding: '32px 0 80px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
            <Link
              to="/learn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, color: C.body }}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Academy
            </Link>

            {/* Hero */}
            <div style={{ marginTop: 28 }}>
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: C.purple,
                }}
              >
                The Trading Diary — Learn
              </div>
              <h1
                style={{
                  fontSize: 58,
                  fontWeight: 700,
                  margin: '0 0 18px',
                  lineHeight: 1.05,
                  background: 'linear-gradient(135deg,#c2c4fb 0%,#8b8ff5 45%,#5b5bd6 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Padrões Gráficos
              </h1>
              <p style={{ fontSize: 20, lineHeight: 1.7, color: C.body, maxWidth: 900, margin: '0 0 32px' }}>
                Cada padrão tem um gráfico grande e isolado. As linhas de tendência seguem exatamente os topos e fundos
                do preço, e os rótulos ficam numa legenda abaixo do gráfico — nunca em cima das linhas. Um padrão não
                funciona porque desenha bonito: funciona porque descreve o que compradores e vendedores estão fazendo
                naquela região.
              </p>
            </div>

            {/* Aviso de manipulação */}
            <div
              style={{
                background: hexToRgba(C.amber, 0.07),
                border: `1px solid ${hexToRgba(C.amber, 0.3)}`,
                borderRadius: 16,
                padding: 26,
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <AlertTriangle className="h-5 w-5" style={{ color: C.amber }} />
                <h2 style={{ fontSize: 24, fontWeight: 700, color: C.amber, margin: 0 }}>
                  Antes de operar qualquer padrão: rompimento falso e manipulação
                </h2>
              </div>
              <p style={{ fontSize: 18, lineHeight: 1.75, color: C.body, margin: '10px 0 0' }}>
                Padrões gráficos são amplamente conhecidos — e é justamente isso que os torna alvo. Todo mundo coloca
                stop no mesmo lugar óbvio, e esse aglomerado de stops é liquidez. É muito comum o mercado romper
                primeiro na direção "errada", capturar esses stops, e só depois fazer o movimento real.
              </p>
              <p style={{ fontSize: 18, lineHeight: 1.75, color: C.body, margin: '10px 0 0' }}>
                Isso é <strong style={{ color: C.text }}>especialmente comum</strong> quando o padrão ocorre numa região
                que também é suporte ou resistência diário/semanal. Quanto mais relevante o nível, maior a chance de
                manipulação antes do movimento verdadeiro.
              </p>
              <p style={{ fontSize: 18, lineHeight: 1.75, color: hexToRgba(C.amber, 0.95), margin: '10px 0 0' }}>
                Regra prática: se o padrão não estiver apoiado por um suporte/resistência de timeframe maior (diário ou
                semanal), confiar no rompimento cru é mais arriscado. O padrão é o gatilho, não a tese.
              </p>
            </div>

            {/* Conceitos gerais */}
            <SectionTitle
              category="Reversão"
              title="Pivôs, Topos e Fundos"
              subtitle="Antes das formações, o bloco básico que se repete em tudo que vem a seguir."
            />

            <Card
              category="Reversão"
              bias="Long"
              title="Pivô de Alta"
              diagram={<PivoAlta />}
              legend={[
                { text: 'Topo anterior', kind: 'dash' },
                { text: 'Toca, não ultrapassa', color: C.green, kind: 'dot' },
              ]}
            >
              <Para>
                Sobe, forma o topo (linha tracejada). Recua para um fundo mais alto, sobe além do topo anterior e recua
                uma segunda vez — esse segundo fundo{' '}
                <strong style={{ color: C.text }}>bate exatamente no nível do topo anterior, sem ultrapassá-lo</strong>.
                É esse toque que confirma o pivô e transforma a antiga resistência em suporte.
              </Para>
              <Para>
                Cada topo, cada fundo e cada ombro de um padrão é um pivô. Aprender a marcar pivôs é o que permite
                enxergar as formações em tempo real, em vez de reconhecê-las só depois de prontas.
              </Para>
            </Card>

            <Card
              category="Reversão"
              bias="Short"
              title="Topo Duplo"
              diagram={<TopoDuplo />}
              legend={legNeckline}
            >
              <Para>
                Os dois topos ficam dentro de ~2% um do outro. A seta que mede a altura do padrão (neckline até o topo)
                é <strong style={{ color: C.purple }}>replicada com a mesma cor e o mesmo tamanho</strong> a partir do
                rompimento do neckline.
              </Para>
              <Field label="Por que acontece" color={C.purple}>
                O preço testa uma resistência, é rejeitado, recua e volta a testar a mesma região — e falha de novo. O
                segundo teste mostra que o fluxo comprador já não consegue absorver a oferta parada ali. Quem comprou o
                repique fica preso, e a saída dessas posições vira o combustível da queda.
              </Field>
              <Field label="Entrada" color={C.purple}>
                Short na rejeição do segundo topo (mais agressivo) ou no rompimento do neckline (mais conservador).
              </Field>
              <Field label="Alvo" color={C.purple}>
                Altura do padrão (neckline até o topo) replicada a partir do rompimento. Alvo parcial em 50% dessa
                projeção.
              </Field>
            </Card>

            <Card category="Reversão" bias="Long" title="Fundo Duplo" diagram={<FundoDuplo />} legend={legNeckline}>
              <Para>
                Espelho do topo duplo: a seta que mede a altura do neckline até o fundo é replicada, mesma cor e
                tamanho, para cima a partir do rompimento.
              </Para>
              <Field label="Por que acontece" color={C.purple}>
                O preço testa um suporte, sobe, volta a testar e não consegue fazer nova mínima. O vendedor perdeu
                capacidade de empurrar o preço para baixo, e os vendidos passam a ser os pressionados.
              </Field>
              <Field label="Entrada" color={C.purple}>
                Long na formação do segundo fundo, ou no rompimento da resistência entre os dois fundos (neckline).
              </Field>
              <Field label="Alvo" color={C.purple}>
                Altura do padrão replicada para cima a partir do rompimento. Parcial em 50% da projeção.
              </Field>
            </Card>

            <Card category="Reversão" bias="Short" title="Topo Triplo" diagram={<TopoTriplo />} legend={legNeckline}>
              <Para>
                Três topos na mesma região. Mesma lógica do topo duplo: a seta mostra de onde vem a medida e é
                replicada no rompimento.
              </Para>
              <Field label="Por que acontece" color={C.purple}>
                Cada rejeição adicional confirma que existe um vendedor grande defendendo aquele preço. Quanto mais
                toques, mais forte a zona — e mais gente comprada logo abaixo esperando o rompimento que nunca vem.
              </Field>
              <Field label="Entrada" color={C.purple}>
                Short no terceiro toque com rejeição, ou no rompimento do neckline.
              </Field>
              <Field label="Alvo" color={C.purple}>Altura do padrão replicada a partir do rompimento.</Field>
            </Card>

            <Card category="Reversão" bias="Long" title="Fundo Triplo" diagram={<FundoTriplo />} legend={legNeckline}>
              <Para>
                Mesma leitura do fundo duplo, com três fundos na mesma região confirmando o suporte antes do
                rompimento.
              </Para>
              <Field label="Por que acontece" color={C.purple}>
                Três defesas do mesmo suporte. Cada defesa confirma um comprador grande posicionado naquele preço.
              </Field>
              <Field label="Entrada" color={C.purple}>
                Long no terceiro toque com rejeição, ou no rompimento do neckline.
              </Field>
              <Field label="Alvo" color={C.purple}>Altura do padrão replicada a partir do rompimento.</Field>
            </Card>

            <SectionTitle category="Reversão" title="OCO, Diamante e Fundo Arredondado" />

            <Card
              category="Reversão"
              bias="Short"
              title="Ombro-Cabeça-Ombro (OCO)"
              diagram={<OCO />}
              legend={[
                { text: 'Ombro E · Cabeça · Ombro D' },
                { text: 'Neckline', kind: 'dash' },
                { text: 'Alvo 1 = altura do ombro', color: C.red },
                { text: 'Alvo 2 = neckline → cabeça', color: C.purple },
              ]}
            >
              <Para>
                <strong style={{ color: C.text }}>Alvo 1</strong> é a altura do ombro, projetada a partir do
                rompimento. <strong style={{ color: C.text }}>Alvo 2</strong>, maior, é a distância total do neckline
                até a cabeça — mesmo ponto de rompimento, medidas diferentes.
              </Para>
              <Field label="Por que acontece" color={C.purple}>
                Numa tendência de alta, o mercado forma o ombro esquerdo, depois a cabeça (topo mais alto) e finalmente
                um ombro direito mais baixo. Esse topo mais baixo é a evidência objetiva: o comprador não conseguiu
                mais empurrar o preço para uma nova máxima.
              </Field>
              <Field label="Entrada" color={C.purple}>
                Short no rompimento do neckline — a linha que liga os dois vales entre ombros e cabeça.
              </Field>
            </Card>

            <Card
              category="Reversão"
              bias="Long"
              title="OCO Invertido (OCOI)"
              diagram={<OCOI />}
              legend={[
                { text: 'Ombro E · Cabeça · Ombro D' },
                { text: 'Neckline', kind: 'dash' },
                { text: 'Alvo 1 = altura do ombro', color: C.green },
                { text: 'Alvo 2 = neckline → cabeça', color: C.purple },
              ]}
            >
              <Para>
                Espelho do OCO. Mesma leitura de Alvo 1 (altura do próprio ombro) e Alvo 2 (neckline até a cabeça),
                agora projetados para cima após o rompimento.
              </Para>
              <Field label="Por que acontece" color={C.purple}>
                Ombro esquerdo, cabeça (fundo mais baixo) e ombro direito mais alto. Esse fundo mais alto é a
                assinatura da perda de força vendedora.
              </Field>
              <Field label="Entrada" color={C.purple}>
                Long no rompimento do neckline — a linha que liga os dois picos entre ombros e cabeça.
              </Field>
            </Card>

            <Card
              category="Reversão"
              title="Diamante"
              diagram={<Diamante />}
              legend={[{ text: 'Envelope (topos e fundos cada vez maiores, depois cada vez menores)', kind: 'dash' }]}
            >
              <Para>
                A onda vem da esquerda com oscilações cada vez maiores até o pico, depois volta a formar oscilações
                cada vez menores — o contorno dos topos e fundos desenha um diamante. Diferente dos outros padrões de
                reversão, <strong style={{ color: C.text }}>o diamante não tem uma medição de alvo padrão</strong> —
                trate o rompimento como sinal direcional, não como projeção de preço.
              </Para>
              <Field label="Por que acontece" color={C.purple}>
                Primeiro a volatilidade explode (indecisão e disputa), depois contrai num nível esticado. A expansão
                mostra exaustão da tendência; a contração mostra que ninguém mais quer pagar mais caro. Quando quebra,
                quebra para o lado de quem ficou preso.
              </Field>
              <Field label="Entrada" color={C.purple}>
                No rompimento da borda do diamante — para baixo se o padrão está no topo, para cima se está no fundo.
              </Field>
            </Card>

            <Card
              category="Reversão"
              bias="Long"
              title="Fundo Arredondado"
              diagram={<FundoArredondado />}
              legend={[
                { text: 'Resistência do início da cuia', kind: 'dash' },
                { text: 'Rompimento no fim da curva', color: C.green },
              ]}
            >
              <Para>
                Reversão gradual em formato de "U" ou cuia. Não há um evento único: o sentimento migra lentamente de
                vendedor para comprador, com a pressão de venda secando aos poucos. É típico de ativos esquecidos que
                começam a ser acumulados sem pressa.
              </Para>
              <Field label="Entrada" color={C.purple}>
                Long na confirmação do rompimento no fim da curva — a resistência formada pelo início da cuia.
              </Field>
              <Field label="Alvo" color={C.purple}>
                Profundidade da cuia (resistência até o fundo) projetada a partir do rompimento; parcial em 50% dessa
                projeção.
              </Field>
            </Card>

            <SectionTitle category="Continuação" title="Triângulos" />

            <Card
              category="Continuação"
              bias="Long"
              title="Triângulo Ascendente"
              diagram={<TrianguloAscendente />}
              legend={[
                { text: 'Resistência plana / Suporte ascendente', kind: 'dash' },
                { text: 'Alvo = mesmo tamanho do mastro', color: C.green },
              ]}
            >
              <Para>
                A resistência é plana (todos os topos no mesmo nível) e o suporte sobe, tocando cada fundo. O comprador
                aceita pagar cada vez mais caro — tem pressa — enquanto o vendedor defende sempre o mesmo preço. O
                mastro que entra no triângulo é replicado, mesma cor e tamanho, no rompimento.
              </Para>
              <Field label="Entrada" color={C.purple}>
                Long no rompimento da resistência plana, preferencialmente com reteste por cima.
              </Field>
              <TargetsBox
                title="Potenciais alvos"
                color={C.green}
                chips={['0.5× mastro', '1× mastro', '1.5× mastro', '2× mastro']}
              />
            </Card>

            <Card
              category="Continuação"
              bias="Short"
              title="Triângulo Descendente"
              diagram={<TrianguloDescendente />}
              legend={[
                { text: 'Suporte plano / Resistência descendente', kind: 'dash' },
                { text: 'Alvo = mesmo tamanho do mastro', color: C.red },
              ]}
            >
              <Para>
                Espelho do ascendente: suporte plano, resistência caindo tocando cada topo. O vendedor aceita vender
                cada vez mais barato enquanto o comprador defende sempre no mesmo preço — é uma parede sendo martelada
                até não sobrar ordem. O mastro inicial é replicado no rompimento do suporte.
              </Para>
              <Field label="Entrada" color={C.purple}>
                Short no rompimento do suporte plano, preferencialmente com reteste pelo lado de baixo.
              </Field>
              <TargetsBox
                title="Potenciais alvos"
                color={C.red}
                chips={['0.5× mastro', '1× mastro', '1.5× mastro', '2× mastro']}
              />
            </Card>

            <Card
              category="Continuação"
              bias="Long"
              title="Triângulo Simétrico"
              diagram={<TrianguloSimetrico />}
              legend={[
                { text: 'Resistência caindo / Suporte subindo', kind: 'dash' },
                { text: 'Alvo = mesmo tamanho do mastro', color: C.green },
              ]}
            >
              <Para>
                As duas linhas convergem: resistência caindo tocando os topos, suporte subindo tocando os fundos. Ele
                tende a continuar na direção da perna que o originou. O mastro é replicado no rompimento, para cima ou
                para baixo conforme a direção.
              </Para>
              <Field label="Entrada" color={C.purple}>
                No rompimento da borda do triângulo, a favor da perna que originou o padrão — se veio de alta, long; se
                veio de baixa, short.
              </Field>
              <Callout color={C.amber}>
                <strong>Padrão bilateral e perigoso.</strong> O preço pode romper para qualquer lado, especialmente se
                falhar volume/contexto. Não opere só pela forma — exige confirmação de contexto (suporte/resistência de
                timeframe maior, volume, momentum) e stop apertado fora do triângulo.
              </Callout>
              <TargetsBox
                title="Potenciais alvos"
                color={C.green}
                chips={['0.5× mastro', '1× mastro', '1.5× mastro', '2× mastro']}
              />
            </Card>

            <SectionTitle category="Continuação" title="Canais e Cunhas" />

            <Card
              category="Continuação"
              bias="Long"
              title="Canal de Alta"
              diagram={<CanalAlta />}
              legend={[
                { text: 'Suporte e resistência paralelos', kind: 'dash' },
                { text: 'Alvo = mesma largura do canal', color: C.green },
              ]}
            >
              <Para>
                Duas retas paralelas tocando os fundos e os topos. A largura do canal é medida e replicada, mesma cor e
                tamanho, a partir do rompimento da resistência.
              </Para>
              <TargetsBox
                title="Potenciais alvos"
                color={C.green}
                chips={['Meio canal', '1 canal', '1 canal e meio', '2 canais']}
              />
            </Card>

            <Card
              category="Continuação"
              bias="Short"
              title="Canal de Baixa"
              diagram={<CanalBaixa />}
              legend={[
                { text: 'Suporte e resistência paralelos', kind: 'dash' },
                { text: 'Alvo = mesma largura do canal', color: C.red },
              ]}
            >
              <Para>Mesma leitura, invertida: a largura do canal é replicada a partir do rompimento do suporte.</Para>
              <TargetsBox
                title="Potenciais alvos"
                color={C.red}
                chips={['Meio canal', '1 canal', '1 canal e meio', '2 canais']}
              />
            </Card>

            <Card
              category="Reversão"
              bias="Short"
              title="Canal de Alta em Resistência"
              diagram={<CanalAltaEmResistencia />}
              legend={[
                { text: 'Resistência de timeframe maior', color: C.red, kind: 'dash' },
                { text: 'Canal de alta', kind: 'dash' },
                { text: 'Perda do canal = entrada', color: C.red },
              ]}
            >
              <Para>
                O preço sobe fazendo topos e fundos ascendentes dentro de um canal, mas chega numa resistência
                relevante. Ali a tendência de curto prazo encontra oferta de timeframe maior. Sinal extra de fraqueza:
                se a amplitude entre topos e fundos vai diminuindo, o movimento já está perdendo força antes mesmo do
                rompimento.
              </Para>
              <Field label="Entrada" color={C.purple}>
                Short na perda da linha inferior do canal, dentro da zona de resistência.
              </Field>
              <Field label="Alvo" color={C.purple}>
                Alvo 1: 50% da altura do canal. Alvo 2: base do canal / próximo suporte relevante.
              </Field>
            </Card>

            <Card
              category="Reversão"
              bias="Long"
              title="Canal de Baixa em Suporte"
              diagram={<CanalBaixaEmSuporte />}
              legend={[
                { text: 'Suporte de timeframe maior', color: C.green, kind: 'dash' },
                { text: 'Canal de baixa', kind: 'dash' },
                { text: 'Rompimento do canal = entrada', color: C.green },
              ]}
            >
              <Para>
                Espelho do canal de alta. O preço cai em canal ordenado até encontrar um suporte relevante de timeframe
                maior. Se a amplitude do canal vai estreitando, a queda já está sem força — o movimento vira mais
                realização do que venda agressiva.
              </Para>
              <Field label="Entrada" color={C.purple}>
                Long no rompimento da linha superior do canal, dentro da zona de suporte.
              </Field>
              <Field label="Alvo" color={C.purple}>
                Alvo 1: 50% da altura do canal. Alvo 2: topo do canal / próxima resistência relevante.
              </Field>
            </Card>

            <Card
              category="Continuação"
              bias="Short"
              title="Cunha Ascendente"
              diagram={<CunhaAscendente />}
              legend={[
                { text: 'Duas retas subindo, convergindo', kind: 'dash' },
                { text: 'Alvo = mesmo tamanho da cunha', color: C.red },
              ]}
            >
              <Para>
                Cada nova perna de alta é menor que a anterior — o comprador está sem fôlego, comprando por inércia.
                Sinal de reversão de baixa apesar da subida. A seta de rompimento aponta para baixo com o{' '}
                <strong style={{ color: C.red }}>mesmo tamanho da altura da cunha</strong>.
              </Para>
              <Field label="Entrada" color={C.purple}>Short no rompimento da linha inferior da cunha.</Field>
              <TargetsBox title="Potenciais alvos" color={C.red} chips={['0.5× cunha', '1× cunha', '1.5× cunha']} />
            </Card>

            <Card
              category="Continuação"
              bias="Long"
              title="Cunha Descendente"
              diagram={<CunhaDescendente />}
              legend={[
                { text: 'Duas retas caindo, convergindo', kind: 'dash' },
                { text: 'Alvo = mesmo tamanho da cunha', color: C.green },
              ]}
            >
              <Para>
                Os fundos caem menos do que os topos: a venda está perdendo amplitude a cada perna. Mesma lógica
                invertida — a seta de rompimento aponta para cima com o mesmo tamanho da altura da cunha.
              </Para>
              <Field label="Entrada" color={C.purple}>Long no rompimento da linha superior da cunha.</Field>
              <TargetsBox title="Potenciais alvos" color={C.green} chips={['0.5× cunha', '1× cunha', '1.5× cunha']} />
            </Card>

            <SectionTitle category="Continuação" title="Bandeiras e Flâmulas" />

            <Card
              category="Continuação"
              bias="Long"
              title="Bandeira de Alta"
              diagram={<BandeiraAlta />}
              legend={[
                { text: 'Mastro', color: C.green },
                { text: 'Alvo 1 = altura da bandeira', color: C.amber },
                { text: 'Alvo 2 = mastro replicado', color: C.green },
              ]}
            >
              <Para>
                <strong style={{ color: C.green }}>Mastro</strong> é o impulso inicial.{' '}
                <strong style={{ color: C.amber }}>Alvo 1</strong> é a altura da bandeira, projetada a partir do
                rompimento. <strong style={{ color: C.green }}>Alvo 2</strong>, mais ambicioso, é a altura do mastro
                completo — mesma cor da medida original.
              </Para>
              <Field label="Entrada" color={C.purple}>
                No rompimento do canal da bandeira, a favor do impulso original. Stop logo abaixo da bandeira — por
                isso o risco é pequeno.
              </Field>
              <Callout color={C.purple}>
                <strong>Nota de precisão:</strong> medir o mastro projetando-o a partir do TOPO da bandeira (não do
                ponto de rompimento) costuma cravar o alvo com mais precisão. A confiabilidade aumenta muito quando
                esse alvo coincide com um suporte ou resistência real já existente no gráfico — confluência de projeção
                + zona histórica. Sem confluência, a projeção ainda é útil, mas menos precisa. Use como referência de
                entrada ou saída — total ou parcial.
              </Callout>
              <TargetsBox
                title="Alvo 2 = mesmo tamanho do mastro"
                color={C.green}
                note="Projeção igual à altura do mastro, na mesma cor da seta."
              />
            </Card>

            <Card
              category="Continuação"
              bias="Short"
              title="Bandeira de Baixa"
              diagram={<BandeiraBaixa />}
              legend={[
                { text: 'Mastro', color: C.red },
                { text: 'Alvo 1 = altura da bandeira', color: C.amber },
                { text: 'Alvo 2 = mastro replicado', color: C.red },
              ]}
            >
              <Para>
                Mesma leitura invertida: Alvo 1 é a altura da bandeira, Alvo 2 é a altura do mastro completo, ambos
                projetados para baixo a partir do rompimento.
              </Para>
              <Field label="Entrada" color={C.purple}>
                Short no rompimento da parte inferior do canal da bandeira.
              </Field>
              <Callout color={C.purple}>
                <strong>Nota de precisão:</strong> medir o mastro a partir do FUNDO da bandeira (não do rompimento)
                crava o alvo com mais precisão. A confiabilidade sobe quando esse alvo coincide com um suporte ou
                resistência real já existente no gráfico. Sem confluência, a projeção ainda é útil, mas menos precisa.
              </Callout>
              <TargetsBox
                title="Alvo 2 = mesmo tamanho do mastro"
                color={C.red}
                note="Projeção igual à altura do mastro, na mesma cor da seta."
              />
            </Card>

            <Card
              category="Continuação"
              bias="Long"
              title="Flâmula de Alta"
              diagram={<FlamulaAlta />}
              legend={[
                { text: 'Mastro', color: C.green },
                { text: 'Alvo 1 = altura da flâmula', color: C.amber },
                { text: 'Alvo 2 = mastro replicado', color: C.green },
              ]}
            >
              <Para>
                Igual à bandeira, mas a consolidação converge num triangulozinho simétrico em vez de um canal paralelo.
                O mastro (subida antes da consolidação) é a base da projeção: o rompimento tende a repetir esse mesmo
                movimento — mesma seta verde, replicada.
              </Para>
              <Field label="Entrada" color={C.purple}>No rompimento da flâmula, a favor do mastro.</Field>
              <TargetsBox
                title="Alvo 2 = mesmo tamanho do mastro"
                color={C.green}
                note="Projeção igual à altura do mastro, na mesma cor da seta."
              />
            </Card>

            <Card
              category="Continuação"
              bias="Short"
              title="Flâmula de Baixa"
              diagram={<FlamulaBaixa />}
              legend={[
                { text: 'Mastro', color: C.red },
                { text: 'Alvo 1 = altura da flâmula', color: C.amber },
                { text: 'Alvo 2 = mastro replicado', color: C.red },
              ]}
            >
              <Para>
                Mesma leitura invertida: o mastro de queda inicial define o tamanho esperado do movimento após o
                rompimento da flâmula.
              </Para>
              <Field label="Entrada" color={C.purple}>Short no rompimento da flâmula, a favor do mastro.</Field>
              <TargetsBox
                title="Alvo 2 = mesmo tamanho do mastro"
                color={C.red}
                note="Projeção igual à altura do mastro, na mesma cor da seta."
              />
            </Card>

            <SectionTitle category="Ferramentas" title="Falso Rompimento e Pullback" />

            <Card
              category="Ferramentas"
              title="Falso Rompimento (exemplo prático)"
              diagram={<FalsoRompimento />}
              legend={[
                { text: 'Resistência e LTA (suporte) do triângulo', kind: 'dash' },
                { text: 'Falso rompimento (rompe e volta)', color: '#fbbf24', kind: 'dot' },
                { text: 'Entrada = reteste da LTA por baixo', color: C.purple, kind: 'dot' },
              ]}
            >
              <Para>
                Dentro do triângulo (resistência e LTA marcadas), o preço vem de cima e{' '}
                <strong style={{ color: C.text }}>rompe a LTA para baixo</strong> — o ponto amarelo marca esse falso
                rompimento. Ele volta e <strong style={{ color: C.purple }}>retesta a mesma LTA por baixo</strong> —
                esse reteste é a entrada — antes de o preço seguir e romper a resistência do outro lado.
              </Para>
            </Card>

            <Card
              category="Ferramentas"
              title="Estudo de caso: falso rompimento no triângulo descendente"
              diagram={<FalsoRompimentoTriangulo />}
              legend={[
                { text: 'Suporte plano e LTB do triângulo', kind: 'dash' },
                { text: 'Rompimento falso da linha de tendência', color: '#fbbf24', kind: 'dot' },
                { text: 'Entrada no pullback', color: C.purple, kind: 'dot' },
                { text: 'Perda do suporte plano', color: C.red },
              ]}
            >
              <Para>
                Triângulo descendente clássico: linha de tendência de baixa no topo e suporte plano embaixo. No último
                pico, o preço rompe ACIMA da linha de tendência — e falha. O mercado varre os stops dos vendidos e as
                compras de rompimento dos otimistas, e então desaba pelo suporte plano.
              </Para>
              <Field label="Como entrar no short depois do falso rompimento" color={C.purple}>
                <strong style={{ color: C.text }}>Opção A — Reteste do suporte plano rompido:</strong> depois que o
                preço perde o suporte plano do triângulo, espera o pullback voltar até esse mesmo nível — que agora
                atua como resistência — e entra na rejeição.
                <br />
                <strong style={{ color: C.text }}>Opção B — Retração de Fibonacci:</strong> traça a retração do topo do
                rompimento falso até o fundo seguinte e procura a entrada nos níveis centrais —{' '}
                <strong style={{ color: C.text }}>0,5 e 0,618</strong>, o "coração do Fibo". É ali que o pullback
                costuma terminar.
                <br />
                <strong style={{ color: C.text }}>Opção C — Reteste da linha de tendência:</strong> espera o preço
                voltar até a própria LTA que foi rompida no falso rompimento e entra na rejeição.
              </Field>
              <Callout color={C.purple}>
                Essa técnica não é exclusiva do triângulo descendente. Vale para <strong>qualquer padrão</strong>:
                depois de um falso rompimento, a retração de Fibonacci ou o reteste da linha rompida oferecem a entrada
                com o melhor risco/retorno — porque o stop fica logo acima do pavio do rompimento falso.
              </Callout>
            </Card>

            <div
              style={{
                background: C.card,
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 26,
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <Chip label="Ferramentas" color={C.amber} />
              </div>
              <div style={{ fontSize: 30, fontWeight: 600, marginBottom: 20, color: C.text }}>Pullback / Reteste</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                <div>
                  <PullbackSuportePlano />
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 16, fontWeight: 600, color: C.legend }}>
                    Suporte plano
                  </div>
                </div>
                <div>
                  <PullbackFibo />
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 16, fontWeight: 600, color: C.purple }}>
                    Coração de Fibo (50–61.8%)
                  </div>
                </div>
              </div>
              <Para>
                O reteste depois do rompimento pode acontecer em dois lugares: num{' '}
                <strong style={{ color: C.text }}>suporte plano</strong> já testado antes, ou na zona de{' '}
                <strong style={{ color: C.purple }}>50%–61.8% de Fibonacci</strong> traçada do movimento anterior.
              </Para>
            </div>

            <Card
              category="Ferramentas"
              title="Falso rompimento não é a única forma de operar — e padrões podem estar aninhados"
              diagram={<PullbackFibo />}
            >
              <Para>
                O falso rompimento é <strong style={{ color: C.text }}>uma técnica de entrada</strong>, não a regra
                geral dos padrões. Se uma reversão se formou de forma completa e válida — por exemplo, um topo duplo
                limpo, com rejeição no segundo topo e rompimento do neckline — esse padrão por si só já é gatilho
                suficiente, sem precisar esperar um falso rompimento antes.
              </Para>
              <Para>
                Além disso, padrões podem aparecer <strong style={{ color: C.text }}>aninhados</strong> dentro de
                outros padrões maiores: um topo duplo pequeno pode se formar dentro de uma cunha ascendente maior, ou
                uma bandeira dentro de um canal de alta. Nesses casos, o padrão menor pode ser operado de forma
                independente — com seu próprio critério de entrada, stop e alvo — mesmo que o padrão maior ainda não
                tenha se resolvido.
              </Para>
            </Card>

            <SectionTitle category="Ferramentas" title="Espelhamento de Canal" />

            <Card
              category="Ferramentas"
              title="Espelhamento de canal"
              diagram={<EspelhamentoCanal />}
              legend={[
                { text: 'Canal original', kind: 'dash' },
                { text: 'Canal espelhado a partir do rompimento = zona de alvo', color: C.purple, kind: 'dash' },
              ]}
            >
              <Para>
                Quando o preço rompe um canal, uma técnica heurística de alvo é espelhar o próprio canal: copiar a
                mesma amplitude e inclinação a partir do ponto de rompimento. O topo do canal espelhado vira a região
                de alvo. É uma ferramenta <strong style={{ color: C.text }}>menos precisa</strong> do que a projeção do
                mastro da bandeira — trate como zona de atenção, não como número exato.
              </Para>
            </Card>

            <Card
              category="Ferramentas"
              title="Parciais por Espelhamento Sucessivo"
              diagram={<EspelhamentoSucessivo />}
              legend={[{ text: 'Alvo 1, Alvo 2, Alvo 3 — mesma distância espelhada', color: C.purple }]}
            >
              <Para>
                A distância de um movimento dentro do canal é medida e espelhada para o próximo, sucessivamente. Cada
                alvo nasce da mesma distância medida no movimento anterior, projetada a partir do próximo pivô.
              </Para>
              <Para>
                Na prática: faça uma parcial na <strong style={{ color: C.text }}>metade</strong> de cada projeção e
                outra no <strong style={{ color: C.text }}>fim</strong> dela. Quando a próxima consolidação se formar,
                repita o processo. Alternativa discricionária: se o mercado sinalizar reversão (perda de força,
                divergência, nível de timeframe maior), saia de vez em vez de continuar escalando.
              </Para>
            </Card>

            <SectionTitle category="Ferramentas" title="Fibonacci Retração" />

            <Card
              category="Ferramentas"
              bias="Queda"
              title="Retração em Tendência de Queda"
              diagram={<FibRetracaoQueda />}
              legend={[
                { text: '0% (topo)' },
                { text: '23.6% · 38.2% · 61.8%', color: C.purple },
                { text: '50%', color: C.purpleSoft },
                { text: '100% (fundo)' },
              ]}
            >
              <Para>
                Traçada do topo (0%) até o fundo (100%) do movimento de queda. O preço puxa de volta até um dos níveis
                — geralmente 38.2%, 50% ou 61.8% — antes de continuar caindo. Os níveis centrais (0,5 e 0,618) são o
                "coração do Fibo", a faixa de reação mais observada.
              </Para>
              <TargetsBox title="Níveis" color={C.purple} chips={['0', '0,382', '0,5', '0,618', '0,786', '1']} />
            </Card>

            <Card
              category="Ferramentas"
              bias="Alta"
              title="Retração em Tendência de Alta"
              diagram={<FibRetracaoAlta />}
              legend={[
                { text: '0% (fundo)' },
                { text: '23.6% · 38.2% · 61.8%', color: C.purple },
                { text: '50%', color: C.purpleSoft },
                { text: '100% (topo)' },
              ]}
            >
              <Para>
                Espelho da anterior: traçada do fundo (0%) até o topo (100%) do movimento de alta, para localizar onde
                o pullback tende a encontrar suporte.
              </Para>
              <TargetsBox title="Níveis" color={C.purple} chips={['0', '0,382', '0,5', '0,618', '0,786', '1']} />
            </Card>

            <SectionTitle
              category="Ferramentas"
              title="Fibonacci Extensão"
              subtitle="Sempre: um clique no fundo, dois cliques no topo."
            />

            <Card
              category="Ferramentas"
              bias="Alta"
              title="Extensão em Tendência de Alta"
              diagram={<FibExtensaoAlta />}
              legend={[
                { text: '1º clique — fundo · 2º clique — topo', color: C.purple, kind: 'dot' },
                { text: '0% (no topo) · 61.8% · 100%', color: C.purpleSoft },
              ]}
            >
              <Para>
                Primeiro clique no fundo, segundo clique no topo, terceiro no pullback.{' '}
                <strong style={{ color: C.text }}>O nível 0% fica no topo</strong> (o 2º clique) — não no pullback — e
                os níveis de extensão se projetam a partir dele para cima.
              </Para>
              <TargetsBox
                title="Níveis"
                color={C.purple}
                chips={['0', '0,618', '1', '1,618', '2,272', '2,618', '3,272', '4,236']}
              />
            </Card>

            <Card
              category="Ferramentas"
              bias="Queda"
              title="Extensão em Tendência de Queda"
              diagram={<FibExtensaoQueda />}
              legend={[
                { text: '1º clique — topo · 2º clique — fundo', color: C.purple, kind: 'dot' },
                { text: '0% (no fundo) · 61.8% · 100%', color: C.purpleSoft },
              ]}
            >
              <Para>
                Mesma lógica para baixo: primeiro clique no topo, segundo clique no fundo. O 0% fica no fundo (o 2º
                clique), e os níveis se projetam para baixo a partir dele.
              </Para>
              <TargetsBox
                title="Níveis"
                color={C.purple}
                chips={['0', '0,618', '1', '1,618', '2,272', '2,618', '3,272', '4,236']}
              />
            </Card>

            <div
              style={{
                background: C.card,
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 26,
                fontSize: 17,
                lineHeight: 1.7,
                color: C.body,
              }}
            >
              Este módulo continua sendo expandido. Próximas adições: retângulos, mais estudos de caso de falso
              rompimento e exemplos aplicados aos seus próprios trades.
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
