import React from 'react';

/**
 * Diagramas da lição de Padrões Gráficos.
 * Canvas 1000x380 (alguns 1000x420), fundo #0a0a0e, um diagrama grande e isolado
 * por card. NENHUM rótulo dentro do SVG — as legendas ficam abaixo do gráfico.
 */

const GRID = '#5f5d70';
const PRICE = '#e3e2e8';
const PURPLE = '#8f8ff0';
const GREEN = '#34d399';
const RED = '#f87171';
const AMBER = '#f5b93b';

function Chart({
  children,
  h = 380,
  w = 1000,
}: {
  children: React.ReactNode;
  h?: number;
  w?: number;
}) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img">
      <rect x="0" y="0" width={w} height={h} rx="12" fill="#0a0a0e" />
      {children}
    </svg>
  );
}

const Dash = ({ x1, y1, x2, y2, stroke = GRID, sw = 1.75, da = '7,6' }: {
  x1: number; y1: number; x2: number; y2: number; stroke?: string; sw?: number; da?: string;
}) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw} strokeDasharray={da} />;

const Line = ({ points, stroke = PRICE, sw = 3.5, da }: { points: string; stroke?: string; sw?: number; da?: string }) => (
  <polyline
    points={points}
    fill="none"
    stroke={stroke}
    strokeWidth={sw}
    strokeDasharray={da}
    strokeLinejoin="round"
    strokeLinecap="round"
  />
);

/** Seta vertical (medição/alvo). */
const Arrow = ({ x, y1, y2, color, dashed = false }: { x: number; y1: number; y2: number; color: string; dashed?: boolean }) => {
  const dir = y2 > y1 ? 1 : -1;
  const tip = y2;
  const base = y2 - dir * 18;
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={base + dir * 10} stroke={color} strokeWidth={3.5} strokeDasharray={dashed ? '4,4' : undefined} />
      <polygon points={`${x},${tip} ${x - 9},${base} ${x + 9},${base}`} fill={color} />
    </g>
  );
};

/* ---------------------------------------------------------------- Reversão */

export const PivoAlta = () => (
  <Chart>
    <Dash x1={40} y1={110} x2={960} y2={110} />
    <Line points="40,300 160,110 280,220 400,90 520,110 640,60 760,45" />
    <circle cx={520} cy={110} r={8} fill={GREEN} stroke="#0a0a0e" strokeWidth={2} />
  </Chart>
);

export const TopoDuplo = () => (
  <Chart>
    <Dash x1={40} y1={220} x2={960} y2={220} />
    <Line points="40,260 160,90 280,220 400,95 520,220 620,330 760,330" />
    <Arrow x={160} y1={220} y2={82} color={PURPLE} />
    <Arrow x={580} y1={220} y2={358} color={PURPLE} />
  </Chart>
);

export const FundoDuplo = () => (
  <Chart>
    <Dash x1={40} y1={160} x2={960} y2={160} />
    <Line points="40,100 160,270 280,140 400,265 520,140 620,50 760,50" />
    <Arrow x={160} y1={160} y2={278} color={PURPLE} />
    <Arrow x={580} y1={160} y2={22} color={PURPLE} />
  </Chart>
);

export const TopoTriplo = () => (
  <Chart>
    <Dash x1={40} y1={220} x2={960} y2={220} />
    <Line points="40,260 140,90 220,220 300,95 380,220 460,90 540,220 640,330 760,330" />
    <Arrow x={140} y1={220} y2={82} color={PURPLE} />
    <Arrow x={700} y1={220} y2={358} color={PURPLE} />
  </Chart>
);

export const FundoTriplo = () => (
  <Chart>
    <Dash x1={40} y1={160} x2={960} y2={160} />
    <Line points="40,100 140,270 220,140 300,265 380,140 460,270 540,140 640,50 760,50" />
    <Arrow x={140} y1={160} y2={278} color={PURPLE} />
    <Arrow x={700} y1={160} y2={22} color={PURPLE} />
  </Chart>
);

export const OCO = () => (
  <Chart h={420}>
    <Dash x1={40} y1={220} x2={960} y2={220} />
    <Line points="40,280 160,140 280,220 400,60 520,220 640,140 760,280" />
    <Arrow x={820} y1={220} y2={308} color={RED} />
    <Arrow x={880} y1={220} y2={388} color={PURPLE} />
  </Chart>
);

export const OCOI = () => (
  <Chart h={420}>
    <Dash x1={40} y1={180} x2={960} y2={180} />
    <Line points="40,120 160,260 280,180 400,340 520,180 640,260 760,120" />
    <Arrow x={820} y1={180} y2={92} color={GREEN} />
    <Arrow x={880} y1={180} y2={12} color={PURPLE} />
  </Chart>
);

export const Diamante = ({ flip = false }: { flip?: boolean }) => {
  const f = (pts: string) =>
    flip ? pts.split(' ').map((p) => { const [x, y] = p.split(','); return `${x},${380 - Number(y)}`; }).join(' ') : pts;
  return (
    <Chart>
      <Line points={f('120,140 280,110 440,70 600,120 760,150')} stroke={GRID} sw={1.75} da="7,6" />
      <Line points={f('200,220 360,250 520,300 680,230 840,190')} stroke={GRID} sw={1.75} da="7,6" />
      <Line points={f('40,190 120,140 200,220 280,110 360,250 440,70 520,300 600,120 680,230 760,150 840,190 920,182')} />
    </Chart>
  );
};

export const FundoArredondado = () => (
  <Chart>
    <Dash x1={60} y1={110} x2={960} y2={110} />
    <path
      d="M60,120 C 200,340 380,360 500,360 C 640,360 800,330 880,112"
      fill="none"
      stroke={PRICE}
      strokeWidth={3.5}
      strokeLinecap="round"
    />
    <Arrow x={920} y1={110} y2={20} color={GREEN} />
  </Chart>
);

/* ------------------------------------------------------------ Triângulos */

export const TrianguloAscendente = () => (
  <Chart>
    <Dash x1={140} y1={110} x2={960} y2={110} />
    <Dash x1={240} y1={260} x2={960} y2={135} />
    <Line points="40,300 140,110 240,260 340,110 440,220 540,110 640,190 740,110 840,150" />
    <Arrow x={900} y1={121} y2={22} color={GREEN} />
  </Chart>
);

export const TrianguloDescendente = () => (
  <Chart>
    <Dash x1={140} y1={270} x2={960} y2={270} />
    <Dash x1={240} y1={90} x2={960} y2={270} />
    <Line points="40,60 140,270 240,90 340,270 440,150 540,270 640,190 740,270 840,230" />
    <Arrow x={900} y1={255} y2={353} color={RED} />
  </Chart>
);

export const TrianguloSimetrico = () => (
  <Chart>
    <Dash x1={140} y1={90} x2={960} y2={200} />
    <Dash x1={240} y1={260} x2={960} y2={167} />
    <Line points="40,300 140,90 240,260 340,120 440,230 540,150 640,205 740,175 840,190" />
    <Arrow x={900} y1={187} y2={87} color={GREEN} />
  </Chart>
);

/* -------------------------------------------------------- Canais e cunhas */

export const CanalAlta = () => (
  <Chart>
    <Dash x1={40} y1={320} x2={920} y2={137} />
    <Dash x1={160} y1={220} x2={940} y2={58} />
    <Line points="40,320 160,220 280,270 400,170 520,220 640,120 760,170 880,70" />
    <Arrow x={900} y1={62} y2={8} color={GREEN} />
  </Chart>
);

export const CanalBaixa = () => (
  <Chart>
    <Dash x1={40} y1={60} x2={920} y2={243} />
    <Dash x1={160} y1={160} x2={940} y2={323} />
    <Line points="40,60 160,160 280,110 400,210 520,160 640,260 760,210 880,310" />
    <Arrow x={900} y1={318} y2={372} color={RED} />
  </Chart>
);

/** Canal de alta chegando numa resistência de timeframe maior → perde o canal. */
export const CanalAltaEmResistencia = () => (
  <Chart>
    <Dash x1={40} y1={90} x2={960} y2={90} stroke={RED} />
    <Dash x1={40} y1={330} x2={800} y2={170} />
    <Dash x1={140} y1={250} x2={900} y2={90} />
    <Line points="40,330 140,250 240,290 340,200 440,240 540,150 640,190 700,95 780,250 860,310" />
    <Arrow x={910} y1={250} y2={350} color={RED} />
  </Chart>
);

export const CanalBaixaEmSuporte = () => (
  <Chart>
    <Dash x1={40} y1={290} x2={960} y2={290} stroke={GREEN} />
    <Dash x1={40} y1={50} x2={800} y2={210} />
    <Dash x1={140} y1={130} x2={900} y2={290} />
    <Line points="40,50 140,130 240,90 340,180 440,140 540,230 640,190 700,285 780,130 860,70" />
    <Arrow x={910} y1={130} y2={30} color={GREEN} />
  </Chart>
);

export const CunhaAscendente = () => (
  <Chart>
    <Dash x1={40} y1={300} x2={900} y2={144} />
    <Dash x1={140} y1={240} x2={900} y2={132} />
    <Line points="40,300 140,240 240,262 340,210 440,224 540,180 640,186 740,150 840,148" />
    <Arrow x={900} y1={132} y2={230} color={RED} />
  </Chart>
);

export const CunhaDescendente = () => (
  <Chart>
    <Dash x1={40} y1={80} x2={900} y2={236} />
    <Dash x1={140} y1={140} x2={900} y2={248} />
    <Line points="40,80 140,140 240,118 340,170 440,156 540,200 640,194 740,230 840,232" />
    <Arrow x={900} y1={248} y2={150} color={GREEN} />
  </Chart>
);

/* --------------------------------------------------- Bandeiras e flâmulas */

export const BandeiraAlta = () => (
  <Chart>
    <Dash x1={220} y1={100} x2={680} y2={172} />
    <Dash x1={300} y1={175} x2={680} y2={246} />
    <Line points="40,320 220,100 300,175 380,130 460,205 540,150 620,235 900,60" />
    <Arrow x={130} y1={320} y2={92} color={GREEN} />
    <Arrow x={680} y1={172} y2={90} color={AMBER} />
    <Arrow x={740} y1={172} y2={12} color={GREEN} dashed />
  </Chart>
);

export const BandeiraBaixa = () => (
  <Chart>
    <Dash x1={220} y1={280} x2={680} y2={208} />
    <Dash x1={300} y1={205} x2={680} y2={134} />
    <Line points="40,60 220,280 300,205 380,250 460,175 540,230 620,145 900,320" />
    <Arrow x={130} y1={60} y2={288} color={RED} />
    <Arrow x={680} y1={208} y2={290} color={AMBER} />
    <Arrow x={740} y1={208} y2={368} color={RED} dashed />
  </Chart>
);

export const FlamulaAlta = () => (
  <Chart>
    <Dash x1={220} y1={100} x2={660} y2={155} />
    <Dash x1={300} y1={160} x2={660} y2={147} />
    <Line points="40,320 220,100 300,160 380,130 460,155 540,140 620,148 900,40" />
    <Arrow x={130} y1={320} y2={92} color={GREEN} />
    <Arrow x={620} y1={151} y2={100} color={AMBER} />
    <Arrow x={680} y1={151} y2={12} color={GREEN} dashed />
  </Chart>
);

export const FlamulaBaixa = () => (
  <Chart>
    <Dash x1={220} y1={280} x2={660} y2={225} />
    <Dash x1={300} y1={220} x2={660} y2={233} />
    <Line points="40,60 220,280 300,220 380,250 460,225 540,240 620,232 900,340" />
    <Arrow x={130} y1={60} y2={288} color={RED} />
    <Arrow x={620} y1={229} y2={280} color={AMBER} />
    <Arrow x={680} y1={229} y2={368} color={RED} dashed />
  </Chart>
);

/* ------------------------------------------------------------ Ferramentas */

export const FalsoRompimento = () => (
  <Chart>
    <Dash x1={140} y1={150} x2={900} y2={150} />
    <Dash x1={200} y1={247} x2={900} y2={163} />
    <Line points="40,300 160,150 260,240 340,150 420,221 500,150 600,225 660,196 720,150 900,70" />
    <circle cx={600} cy={225} r={9} fill="#fbbf24" stroke="#0a0a0e" strokeWidth={2} />
    <path d="M600,225 C615,230 635,215 655,200" fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="3,4" />
    <circle cx={660} cy={196} r={8} fill={PURPLE} stroke="#0a0a0e" strokeWidth={2} />
  </Chart>
);

export const PullbackSuportePlano = () => (
  <Chart w={480} h={300}>
    <Dash x1={30} y1={220} x2={450} y2={220} sw={1.5} da="6,5" />
    <Line points="30,180 130,220 220,140 290,220 360,150 450,60" />
  </Chart>
);

export const PullbackFibo = () => (
  <Chart w={480} h={300}>
    <Dash x1={30} y1={230} x2={450} y2={230} sw={1} da="3,4" />
    <Dash x1={30} y1={150} x2={450} y2={150} stroke={PURPLE} />
    <Dash x1={30} y1={60} x2={450} y2={60} sw={1} da="3,4" />
    <Line points="30,180 130,230 220,140 290,155 360,80 450,40" />
  </Chart>
);

/** Falso rompimento dentro do triângulo descendente (estudo de caso). */
export const FalsoRompimentoTriangulo = () => (
  <Chart>
    <Dash x1={140} y1={290} x2={940} y2={290} />
    <Dash x1={120} y1={70} x2={940} y2={280} />
    <Line points="40,60 140,290 240,120 340,290 440,175 540,290 620,120 700,215 780,290 860,350" />
    <circle cx={620} cy={120} r={9} fill="#fbbf24" stroke="#0a0a0e" strokeWidth={2} />
    <circle cx={700} cy={215} r={8} fill={PURPLE} stroke="#0a0a0e" strokeWidth={2} />
    <Arrow x={900} y1={290} y2={368} color={RED} />
  </Chart>
);

/** Espelhamento do próprio canal a partir do rompimento. */
export const EspelhamentoCanal = () => (
  <Chart>
    <Dash x1={60} y1={330} x2={620} y2={230} />
    <Dash x1={60} y1={270} x2={620} y2={170} />
    <Dash x1={620} y1={170} x2={960} y2={110} stroke={PURPLE} />
    <Dash x1={620} y1={110} x2={960} y2={50} stroke={PURPLE} />
    <Line points="60,330 160,270 260,320 360,240 460,290 560,190 620,160 720,120 820,90 900,60" />
    <Arrow x={650} y1={165} y2={100} color={PURPLE} />
  </Chart>
);

export const EspelhamentoSucessivo = () => (
  <Chart h={400}>
    <Dash x1={60} y1={100} x2={960} y2={200} sw={1.5} da="6,5" />
    <Dash x1={60} y1={260} x2={960} y2={360} sw={1.5} da="6,5" />
    <Line points="60,220 220,120 380,260 380,100 540,200 540,40 700,160 700,10 860,120" />
    <Dash x1={220} y1={120} x2={220} y2={260} stroke={PURPLE} sw={2.5} da="2,3" />
    <Dash x1={380} y1={100} x2={380} y2={260} stroke={PURPLE} sw={2.5} da="2,3" />
    <Dash x1={540} y1={40} x2={540} y2={200} stroke={PURPLE} sw={2.5} da="2,3" />
    <Dash x1={700} y1={10} x2={700} y2={160} stroke={PURPLE} sw={2.5} da="2,3" />
  </Chart>
);

/* ------------------------------------------------------------- Fibonacci */

export const FibRetracaoQueda = () => (
  <Chart>
    <Dash x1={60} y1={60} x2={920} y2={60} sw={1} da="3,4" />
    <Dash x1={60} y1={128} x2={920} y2={128} stroke={PURPLE} sw={1.5} da="5,4" />
    <Dash x1={60} y1={176} x2={920} y2={176} stroke={PURPLE} sw={1.5} da="5,4" />
    <Dash x1={60} y1={210} x2={920} y2={210} stroke="#c2c4fb" sw={2} da="5,4" />
    <Dash x1={60} y1={244} x2={920} y2={244} stroke={PURPLE} sw={1.5} da="5,4" />
    <Dash x1={60} y1={300} x2={920} y2={300} sw={1} da="3,4" />
    <Line points="60,60 320,300 500,140 920,340" />
  </Chart>
);

export const FibRetracaoAlta = () => (
  <Chart>
    <Dash x1={60} y1={340} x2={920} y2={340} sw={1} da="3,4" />
    <Dash x1={60} y1={272} x2={920} y2={272} stroke={PURPLE} sw={1.5} da="5,4" />
    <Dash x1={60} y1={224} x2={920} y2={224} stroke={PURPLE} sw={1.5} da="5,4" />
    <Dash x1={60} y1={190} x2={920} y2={190} stroke="#c2c4fb" sw={2} da="5,4" />
    <Dash x1={60} y1={156} x2={920} y2={156} stroke={PURPLE} sw={1.5} da="5,4" />
    <Dash x1={60} y1={100} x2={920} y2={100} sw={1} da="3,4" />
    <Line points="60,340 320,100 500,260 920,60" />
  </Chart>
);

export const FibExtensaoAlta = () => (
  <Chart>
    <Dash x1={60} y1={100} x2={920} y2={100} sw={1} da="3,4" />
    <Dash x1={60} y1={230} x2={920} y2={230} sw={1} da="3,4" />
    <Dash x1={60} y1={330} x2={920} y2={330} sw={1} da="3,4" />
    <Line points="60,230 260,330 460,100 640,190 920,40" />
    <circle cx={260} cy={330} r={7} fill={PURPLE} />
    <circle cx={460} cy={100} r={7} fill={PURPLE} />
  </Chart>
);

export const FibExtensaoQueda = () => (
  <Chart>
    <Dash x1={60} y1={300} x2={920} y2={300} sw={1} da="3,4" />
    <Dash x1={60} y1={170} x2={920} y2={170} sw={1} da="3,4" />
    <Dash x1={60} y1={70} x2={920} y2={70} sw={1} da="3,4" />
    <Line points="60,170 260,70 460,300 640,210 920,360" />
    <circle cx={260} cy={70} r={7} fill={PURPLE} />
    <circle cx={460} cy={300} r={7} fill={PURPLE} />
  </Chart>
);
