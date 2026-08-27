import React from 'react';
import { DiagramFrame, Price, Guide, Label, Arrow } from './PatternDiagram';

/** Espelha uma sequência de pontos no eixo Y (topo <-> fundo). */
function pts(points: string, flip: boolean): string {
  if (!flip) return points;
  return points
    .trim()
    .split(/\s+/)
    .map((p) => {
      const [x, y] = p.split(',').map(Number);
      return `${x},${180 - y}`;
    })
    .join(' ');
}

const mk = (flip: boolean) => (y: number) => (flip ? 180 - y : y);

type D = { flip?: boolean };

/* ---------- Topo/Fundo Duplo ---------- */
export function DoubleTop({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame caption={flip ? 'Fundo duplo — dois testes no mesmo suporte' : 'Topo duplo — dois testes na mesma resistência'}>
      <Price points={pts('8,150 40,140 62,60 92,111 122,58 152,113 190,150 240,168 310,172', flip)} />
      <Guide x1={50} y1={Y(112)} x2={300} y2={Y(112)} />
      <Guide x1={200} y1={Y(137)} x2={300} y2={Y(137)} tone={tone} />
      <Guide x1={200} y1={Y(163)} x2={300} y2={Y(163)} tone={tone} />
      <Arrow x={196} y1={Y(116)} y2={Y(160)} tone={tone} />
      <Label x={54} y={Y(108)} tone="violet">Neckline</Label>
      <Label x={302} y={Y(134)} anchor="end" tone={tone}>Alvo 1 (50%)</Label>
      <Label x={302} y={Y(160)} anchor="end" tone={tone}>Alvo 2 (100%)</Label>
    </DiagramFrame>
  );
}

/* ---------- Topo/Fundo Triplo ---------- */
export function TripleTop({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame caption={flip ? 'Fundo triplo — três defesas do mesmo suporte' : 'Topo triplo — três rejeições na mesma resistência'}>
      <Price points={pts('8,155 34,146 56,58 82,110 108,58 134,111 160,58 188,113 222,150 268,168 310,172', flip)} />
      <Guide x1={44} y1={Y(112)} x2={300} y2={Y(112)} />
      <Guide x1={230} y1={Y(139)} x2={300} y2={Y(139)} tone={tone} />
      <Guide x1={230} y1={Y(166)} x2={300} y2={Y(166)} tone={tone} />
      <Arrow x={226} y1={Y(116)} y2={Y(163)} tone={tone} />
      <Label x={48} y={Y(108)} tone="violet">Neckline</Label>
      <Label x={302} y={Y(136)} anchor="end" tone={tone}>Alvo 1</Label>
      <Label x={302} y={Y(163)} anchor="end" tone={tone}>Alvo 2</Label>
    </DiagramFrame>
  );
}

/* ---------- OCO / OCOI ---------- */
export function HeadShoulders({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame caption={flip ? 'OCOI — cabeça é o fundo mais baixo, ombro direito mais alto' : 'OCO — cabeça é o topo mais alto, ombro direito mais baixo'}>
      <Price points={pts('8,162 40,148 66,92 92,113 120,62 150,114 180,90 212,118 245,150 285,168 310,174', flip)} />
      <Guide x1={80} y1={Y(114)} x2={300} y2={Y(114)} />
      <Guide x1={240} y1={Y(140)} x2={300} y2={Y(140)} tone={tone} />
      <Guide x1={240} y1={Y(166)} x2={300} y2={Y(166)} tone={tone} />
      <Arrow x={236} y1={Y(118)} y2={Y(163)} tone={tone} />
      <Label x={58} y={Y(86)}>Ombro E</Label>
      <Label x={104} y={Y(56)}>Cabeça</Label>
      <Label x={172} y={Y(84)}>Ombro D</Label>
      <Label x={84} y={Y(110)} tone="violet">Neckline</Label>
      <Label x={302} y={Y(137)} anchor="end" tone={tone}>Alvo 1</Label>
      <Label x={302} y={Y(163)} anchor="end" tone={tone}>Alvo 2</Label>
    </DiagramFrame>
  );
}

/* ---------- Diamante ---------- */
export function Diamond({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame caption={flip ? 'Diamante no fundo — expansão e depois contração da volatilidade' : 'Diamante no topo — expansão e depois contração da volatilidade'}>
      <Price points={pts('8,120 38,128 62,104 82,132 104,80 126,152 152,58 176,158 200,88 222,140 242,104 258,126 272,150 292,166 310,172', flip)} />
      <Guide x1={62} y1={Y(115)} x2={152} y2={Y(58)} tone="muted" />
      <Guide x1={152} y1={Y(58)} x2={250} y2={Y(115)} tone="muted" />
      <Guide x1={62} y1={Y(115)} x2={152} y2={Y(170)} tone="muted" />
      <Guide x1={152} y1={Y(170)} x2={250} y2={Y(115)} tone="muted" />
      <Guide x1={240} y1={Y(140)} x2={310} y2={Y(140)} tone={tone} />
      <Guide x1={240} y1={Y(166)} x2={310} y2={Y(166)} tone={tone} />
      <Arrow x={264} y1={Y(120)} y2={Y(162)} tone={tone} />
      <Label x={130} y={Y(52)} tone="violet">Expansão → contração</Label>
      <Label x={308} y={Y(137)} anchor="end" tone={tone}>Alvo 1</Label>
      <Label x={308} y={Y(163)} anchor="end" tone={tone}>Alvo 2</Label>
    </DiagramFrame>
  );
}

/* ---------- Triângulo descendente (topo) / ascendente (fundo) ---------- */
export function DirectionalTriangle({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame caption={flip ? 'Triângulo ascendente — fundos ascendentes espremem a resistência' : 'Triângulo descendente — topos descendentes espremem o suporte'}>
      <Price points={pts('8,52 42,146 72,78 108,148 140,100 172,147 198,120 216,149 238,168 272,174 310,176', flip)} />
      <Guide x1={40} y1={Y(60)} x2={224} y2={Y(140)} tone="muted" />
      <Guide x1={40} y1={Y(149)} x2={236} y2={Y(149)} />
      <Guide x1={250} y1={Y(172)} x2={310} y2={Y(172)} tone={tone} />
      <Arrow x={244} y1={Y(152)} y2={Y(172)} tone={tone} />
      <Label x={44} y={Y(56)}>Topos mais baixos</Label>
      <Label x={44} y={Y(145)} tone="violet">Suporte plano</Label>
      <Label x={308} y={Y(168)} anchor="end" tone={tone}>Alvo = altura do triângulo</Label>
    </DiagramFrame>
  );
}

/* ---------- Canal de alta em resistência / canal de baixa em suporte ---------- */
export function ChannelIntoLevel({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame caption={flip ? 'Canal de baixa chegando num suporte forte' : 'Canal de alta chegando numa resistência forte'}>
      <Price points={pts('8,164 38,142 58,154 88,120 108,134 140,100 158,113 190,76 206,88 232,54 246,66 268,96 292,130 310,148', flip)} />
      <Guide x1={30} y1={Y(146)} x2={244} y2={Y(50)} tone="muted" />
      <Guide x1={44} y1={Y(170)} x2={262} y2={Y(74)} tone="muted" />
      <Guide x1={8} y1={Y(46)} x2={310} y2={Y(46)} />
      <Arrow x={276} y1={Y(96)} y2={Y(140)} tone={tone} />
      <Label x={10} y={Y(42)} tone="violet">{flip ? 'Suporte D/S' : 'Resistência D/S'}</Label>
      <Label x={186} y={Y(126)}>Amplitude estreitando = perda de força</Label>
    </DiagramFrame>
  );
}

/* ---------- Fundo arredondado ---------- */
export function RoundedBottom() {
  return (
    <DiagramFrame caption="Fundo arredondado — troca lenta de sentimento vendedor para comprador">
      <Price points="8,42 34,72 62,104 92,130 124,144 156,146 186,134 214,110 242,78 268,52 292,36 310,28" />
      <Guide x1={8} y1={46} x2={310} y2={46} />
      <Guide x1={250} y1={92} x2={310} y2={92} tone="bull" />
      <Guide x1={250} y1={30} x2={310} y2={30} tone="bull" />
      <Arrow x={244} y1={70} y2={34} tone="bull" />
      <Label x={10} y={40} tone="violet">Resistência da cuia (gatilho)</Label>
      <Label x={308} y={89} anchor="end" tone="bull">Alvo 1</Label>
      <Label x={308} y={26} anchor="end" tone="bull">Alvo 2</Label>
    </DiagramFrame>
  );
}

/* ---------- Cunhas ---------- */
export function Wedge({ flip = false }: D) {
  const Y = mk(flip);
  // flip=false: cunha descendente (viés de alta). flip=true: cunha ascendente (viés de baixa).
  const tone = flip ? 'bear' : 'bull';
  return (
    <DiagramFrame caption={flip ? 'Cunha ascendente — convergente para cima, viés de baixa' : 'Cunha descendente — convergente para baixo, viés de alta'}>
      <Price points={pts('8,44 38,112 58,70 92,126 114,92 144,140 162,114 186,150 202,130 220,148 250,92 282,52 310,32', flip)} />
      <Guide x1={30} y1={Y(56)} x2={222} y2={Y(134)} tone="muted" />
      <Guide x1={44} y1={Y(120)} x2={226} y2={Y(152)} tone="muted" />
      <Arrow x={240} y1={Y(120)} y2={Y(60)} tone={tone} />
      <Label x={236} y={Y(44)} tone={tone}>{flip ? 'Rompimento provável ↓' : 'Rompimento provável ↑'}</Label>
    </DiagramFrame>
  );
}

/* ---------- Bandeira ---------- */
export function Flag({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bear' : 'bull';
  return (
    <DiagramFrame caption={flip ? 'Bandeira de baixa — mastro de queda + consolidação em canal ascendente' : 'Bandeira de alta — mastro de alta + consolidação em canal descendente'}>
      <Price points={pts('8,170 34,150 56,104 78,62 100,40 124,58 146,48 168,70 188,58 208,80 226,66 248,40 276,18 304,8', flip)} />
      <Guide x1={112} y1={Y(38)} x2={232} y2={Y(70)} tone="muted" />
      <Guide x1={116} y1={Y(64)} x2={236} y2={Y(96)} tone="muted" />
      <Guide x1={252} y1={Y(34)} x2={310} y2={Y(34)} tone={tone} />
      <Guide x1={252} y1={Y(10)} x2={310} y2={Y(10)} tone={tone} />
      <Label x={40} y={Y(112)}>Mastro</Label>
      <Label x={150} y={Y(110)} tone="violet">Bandeira</Label>
      <Label x={308} y={Y(31)} anchor="end" tone={tone}>Alvo 1 = altura da bandeira</Label>
      <Label x={308} y={Y(7)} anchor="end" tone={tone}>Alvo 2 = altura do mastro</Label>
    </DiagramFrame>
  );
}

/* ---------- Flâmula ---------- */
export function Pennant({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bear' : 'bull';
  return (
    <DiagramFrame caption={flip ? 'Flâmula de baixa — consolidação convergente após impulso de queda' : 'Flâmula de alta — consolidação convergente após impulso de alta'}>
      <Price points={pts('8,170 34,150 58,104 82,58 104,38 126,74 146,48 164,68 180,54 196,64 210,58 236,34 268,16 302,6', flip)} />
      <Guide x1={104} y1={Y(34)} x2={214} y2={Y(58)} tone="muted" />
      <Guide x1={106} y1={Y(84)} x2={216} y2={Y(62)} tone="muted" />
      <Guide x1={240} y1={Y(30)} x2={310} y2={Y(30)} tone={tone} />
      <Guide x1={240} y1={Y(8)} x2={310} y2={Y(8)} tone={tone} />
      <Label x={40} y={Y(112)}>Mastro</Label>
      <Label x={132} y={Y(104)} tone="violet">Flâmula</Label>
      <Label x={308} y={Y(27)} anchor="end" tone={tone}>Alvo 1</Label>
      <Label x={308} y={Y(5)} anchor="end" tone={tone}>Alvo 2 (mastro)</Label>
    </DiagramFrame>
  );
}

/* ---------- Pivô ---------- */
export function Pivot() {
  return (
    <DiagramFrame caption="Pivô = impulso + recuo. É o bloco que forma topos, fundos e ombros.">
      <Price points="8,160 46,150 84,70 112,108 148,44 178,88 214,26 250,66 286,14 310,20" />
      <Label x={52} y={100} tone="violet">Impulso</Label>
      <Label x={118} y={116}>Recuo</Label>
    </DiagramFrame>
  );
}

/* ---------- Rompimento falso ---------- */
export function FalseBreak() {
  return (
    <DiagramFrame caption="Rompimento falso: varre a liquidez abaixo do nível e só então faz o movimento real.">
      <Price points="8,60 40,96 70,132 100,148 130,140 160,150 186,168 206,150 232,120 262,84 288,52 310,34" />
      <Guide x1={8} y1={148} x2={310} y2={148} />
      <Label x={10} y={144} tone="violet">Suporte do padrão</Label>
      <Label x={166} y={178} tone="bear">Stop hunt</Label>
      <Arrow x={250} y1={110} y2={54} tone="bull" />
      <Label x={252} y={44} tone="bull">Movimento real</Label>
    </DiagramFrame>
  );
}
