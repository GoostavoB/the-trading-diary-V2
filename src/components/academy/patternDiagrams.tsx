import React from 'react';
import { DiagramFrame, Price, Guide, Label, Arrow, Measure, Dot } from './PatternDiagram';

const H = 260;

/** Espelha uma sequência de pontos no eixo Y (topo <-> fundo). */
function pts(points: string, flip: boolean, h: number = H): string {
  if (!flip) return points;
  return points
    .trim()
    .split(/\s+/)
    .map((p) => {
      const [x, y] = p.split(',').map(Number);
      return `${x},${h - y}`;
    })
    .join(' ');
}

const mk = (flip: boolean, h: number = H) => (y: number) => (flip ? h - y : y);

type D = { flip?: boolean };

/* ---------- Topo/Fundo Duplo ---------- */
export function DoubleTop({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame
      caption={
        flip
          ? 'Fundo duplo — a altura do fundo até o neckline é a régua: replicada para cima dá Alvo 1 (metade) e Alvo 2 (inteira).'
          : 'Topo duplo — a altura do topo até o neckline é a régua: replicada para baixo dá Alvo 1 (metade) e Alvo 2 (inteira).'
      }
    >
      <Price points={pts('14,190 50,178 90,66 140,132 190,64 238,134 272,158 300,178 340,200 372,212 406,216', flip)} />
      <Guide x1={70} y1={Y(133)} x2={300} y2={Y(133)} />
      {/* medição original: topo -> neckline */}
      <Measure x={262} y1={Y(64)} y2={Y(133)} tone={tone} label="altura" labelSide="left" />
      {/* mesma régua replicada abaixo do neckline */}
      <Measure x={262} y1={Y(133)} y2={Y(202)} tone={tone} label="mesma altura" labelSide="left" dashed />
      <Measure x={318} y1={Y(133)} y2={Y(167.5)} tone={tone} />
      <Guide x1={310} y1={Y(167.5)} x2={406} y2={Y(167.5)} tone={tone} />
      <Guide x1={250} y1={Y(202)} x2={406} y2={Y(202)} tone={tone} />
      <Label x={16} y={Y(127)} tone="violet">Neckline</Label>
      <Label x={404} y={flip ? 80 : 160} anchor="end" tone={tone}>Alvo 1</Label>
      <Label x={404} y={Y(228)} anchor="end" tone={tone}>Alvo 2</Label>
    </DiagramFrame>
  );
}

/* ---------- Topo/Fundo Triplo ---------- */
export function TripleTop({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame
      caption={
        flip
          ? 'Fundo triplo — três defesas do mesmo suporte. Mesma régua do topo duplo, replicada para cima.'
          : 'Topo triplo — três rejeições na mesma resistência. Mesma régua do topo duplo, replicada para baixo.'
      }
    >
      <Price
        points={pts('14,192 44,180 78,64 112,130 148,64 186,132 222,64 252,136 278,158 306,180 344,202 376,212 406,216', flip)}
      />
      <Guide x1={90} y1={Y(133)} x2={300} y2={Y(133)} />
      <Measure x={266} y1={Y(64)} y2={Y(133)} tone={tone} label="altura" labelSide="left" />
      <Measure x={266} y1={Y(133)} y2={Y(202)} tone={tone} label="mesma altura" labelSide="left" dashed />
      <Measure x={322} y1={Y(133)} y2={Y(167.5)} tone={tone} />
      <Guide x1={314} y1={Y(167.5)} x2={406} y2={Y(167.5)} tone={tone} />
      <Guide x1={250} y1={Y(202)} x2={406} y2={Y(202)} tone={tone} />
      <Label x={16} y={Y(127)} tone="violet">Neckline</Label>
      <Label x={404} y={flip ? 80 : 161} anchor="end" tone={tone}>Alvo 1</Label>
      <Label x={404} y={Y(222)} anchor="end" tone={tone}>Alvo 2</Label>
    </DiagramFrame>
  );
}

/* ---------- OCO / OCOI ---------- */
export function HeadShoulders({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame
      caption={
        flip
          ? 'OCOI — Alvo 1 é a altura do próprio ombro; Alvo 2 é a altura da cabeça até o neckline. As duas réguas são replicadas para cima.'
          : 'OCO — Alvo 1 é a altura do próprio ombro; Alvo 2 é a altura da cabeça até o neckline. As duas réguas são replicadas para baixo.'
      }
    >
      <Price
        points={pts('14,196 46,182 78,110 108,136 146,62 186,138 224,104 250,140 274,162 300,182 336,198 372,208 406,214', flip)}
      />
      <Guide x1={92} y1={Y(137)} x2={300} y2={Y(137)} />
      {/* altura do ombro direito */}
      <Measure x={240} y1={Y(104)} y2={Y(137)} tone={tone} label="ombro" labelSide="left" />
      <Measure x={240} y1={Y(137)} y2={Y(170)} tone={tone} dashed />
      {/* altura da cabeça */}
      <Measure x={306} y1={Y(62)} y2={Y(137)} tone={tone} label="cabeça" labelSide="right" />
      <Measure x={306} y1={Y(137)} y2={Y(212)} tone={tone} dashed />
      <Guide x1={230} y1={Y(170)} x2={406} y2={Y(170)} tone={tone} />
      <Guide x1={296} y1={Y(212)} x2={406} y2={Y(212)} tone={tone} />
      <Label x={34} y={Y(96)}>Ombro E</Label>
      <Label x={122} y={Y(48)}>Cabeça</Label>
      <Label x={196} y={Y(84)}>Ombro D</Label>
      <Label x={16} y={Y(131)} tone="violet">Neckline</Label>
      <Label x={404} y={flip ? 78 : 164} anchor="end" tone={tone}>Alvo 1</Label>
      <Label x={404} y={Y(230)} anchor="end" tone={tone}>Alvo 2</Label>
    </DiagramFrame>
  );
}

/* ---------- Diamante ---------- */
export function Diamond({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame
      caption={
        flip
          ? 'Diamante no fundo — o alvo é a altura total do losango (base ao pico), projetada a partir do rompimento. Alvo único.'
          : 'Diamante no topo — o alvo é a altura total do losango (pico à base), projetada a partir do rompimento. Alvo único.'
      }
    >
      <Price
        points={pts(
          '14,132 40,126 62,138 84,118 104,142 126,100 150,160 174,84 190,172 214,90 238,162 258,110 276,148 292,124 306,138 320,168 344,196 374,212 406,220',
          flip,
        )}
      />
      {/* losango */}
      <Guide x1={100} y1={Y(130)} x2={190} y2={Y(80)} tone="muted" />
      <Guide x1={190} y1={Y(80)} x2={280} y2={Y(130)} tone="muted" />
      <Guide x1={100} y1={Y(130)} x2={190} y2={Y(170)} tone="muted" />
      <Guide x1={190} y1={Y(170)} x2={280} y2={Y(130)} tone="muted" />
      {/* altura total (parte mais larga) e cópia a partir do rompimento */}
      <Measure x={190} y1={Y(80)} y2={Y(170)} tone={tone} />
      <Label x={186} y={Y(190)} anchor="middle" tone={tone}>altura total</Label>
      <Measure x={330} y1={Y(130)} y2={Y(220)} tone={tone} label="mesma altura" labelSide="right" dashed />
      <Guide x1={300} y1={Y(220)} x2={406} y2={Y(220)} tone={tone} />
      <Label x={116} y={Y(60)} tone="violet">Expansão → contração</Label>
      <Label x={404} y={Y(240)} anchor="end" tone={tone}>Alvo único</Label>
    </DiagramFrame>
  );
}

/* ---------- Triângulo descendente (topo) / ascendente (fundo) ---------- */
export function DirectionalTriangle({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame
      caption={
        flip
          ? 'Triângulo ascendente — a altura do triângulo é replicada a partir do rompimento da resistência plana.'
          : 'Triângulo descendente — a altura do triângulo é replicada a partir do rompimento do suporte plano.'
      }
    >
      <Price
        points={pts('14,46 46,146 80,78 116,148 150,104 186,149 214,128 238,150 254,176 276,200 300,218 330,230 366,234 406,236', flip)}
      />
      <Guide x1={40} y1={Y(70)} x2={250} y2={Y(140)} tone="muted" />
      <Guide x1={40} y1={Y(150)} x2={250} y2={Y(150)} />
      <Measure x={30} y1={Y(70)} y2={Y(150)} tone={tone} label="altura" labelSide="right" />
      <Measure x={268} y1={Y(150)} y2={Y(230)} tone={tone} label="mesma altura" labelSide="right" dashed />
      <Guide x1={250} y1={Y(230)} x2={406} y2={Y(230)} tone={tone} />
      <Label x={62} y={Y(46)}>{flip ? 'Fundos mais altos' : 'Topos mais baixos'}</Label>
      <Label x={62} y={Y(168)} tone="violet">{flip ? 'Resistência plana' : 'Suporte plano'}</Label>
      <Label x={404} y={Y(250)} anchor="end" tone={tone}>Alvo = altura do triângulo</Label>
    </DiagramFrame>
  );
}

/* ---------- Canal de alta em resistência / canal de baixa em suporte ---------- */
export function ChannelIntoLevel({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bull' : 'bear';
  return (
    <DiagramFrame
      caption={
        flip
          ? 'Canal de baixa chegando num suporte forte — a amplitude do canal é replicada a partir do rompimento.'
          : 'Canal de alta chegando numa resistência forte — a amplitude do canal é replicada a partir do rompimento.'
      }
    >
      <Price
        points={pts('14,212 40,186 60,200 92,164 112,178 146,142 168,156 200,120 222,134 254,98 276,112 300,74 318,92 344,132 372,168 406,192', flip)}
      />
      <Guide x1={30} y1={Y(175)} x2={300} y2={Y(50)} tone="muted" />
      <Guide x1={52} y1={Y(215)} x2={322} y2={Y(90)} tone="muted" />
      <Guide x1={14} y1={Y(56)} x2={406} y2={Y(56)} />
      <Measure x={78} y1={Y(153)} y2={Y(203)} tone={tone} label="amplitude" labelSide="left" />
      <Measure x={352} y1={Y(92)} y2={Y(142)} tone={tone} label="mesma amplitude" labelSide="left" dashed />
      <Guide x1={330} y1={Y(142)} x2={406} y2={Y(142)} tone={tone} />
      <Label x={16} y={flip ? 226 : 46} tone="violet">{flip ? 'Suporte diário/semanal' : 'Resistência diária/semanal'}</Label>
      <Label x={110} y={Y(240)}>Amplitude estreitando = perda de força</Label>
    </DiagramFrame>
  );
}

/* ---------- Fundo arredondado ---------- */
export function RoundedBottom() {
  return (
    <DiagramFrame caption="Fundo arredondado — a profundidade da cuia é a régua, replicada acima da resistência de rompimento.">
      <Price points="14,120 44,144 76,168 110,190 148,206 186,210 220,200 252,180 282,152 312,122 340,104 372,96 406,92" />
      <Guide x1={14} y1={130} x2={300} y2={130} />
      <Measure x={190} y1={130} y2={210} tone="bull" label="profundidade" labelSide="right" />
      <Measure x={330} y1={130} y2={50} tone="bull" dashed />
      <Guide x1={306} y1={50} x2={406} y2={50} tone="bull" />
      <Guide x1={306} y1={90} x2={406} y2={90} tone="bull" />
      <Label x={16} y={122} tone="violet">Resistência da cuia (gatilho)</Label>
      <Label x={300} y={44} anchor="end" tone="bull">Alvo 2 (100%)</Label>
      <Label x={300} y={84} anchor="end" tone="bull">Alvo 1 (50%)</Label>
    </DiagramFrame>
  );
}

/* ---------- Cunhas ---------- */
export function Wedge({ flip = false }: D) {
  const Y = mk(flip);
  // flip=false: cunha descendente (viés de alta). flip=true: cunha ascendente (viés de baixa).
  const tone = flip ? 'bear' : 'bull';
  return (
    <DiagramFrame
      caption={
        flip
          ? 'Cunha ascendente — convergente para cima, viés de baixa. A maior amplitude da cunha é replicada a partir do rompimento.'
          : 'Cunha descendente — convergente para baixo, viés de alta. A maior amplitude da cunha é replicada a partir do rompimento.'
      }
    >
      <Price
        points={pts('14,52 44,132 66,84 96,148 120,104 152,164 174,132 200,174 220,152 240,170 262,124 290,88 320,64 360,44 406,34', flip)}
      />
      <Guide x1={34} y1={Y(70)} x2={252} y2={Y(158)} tone="muted" />
      <Guide x1={52} y1={Y(137)} x2={258} y2={Y(178)} tone="muted" />
      <Measure x={26} y1={Y(70)} y2={Y(137)} tone={tone} label="amplitude" labelSide="right" />
      <Measure x={336} y1={Y(150)} y2={Y(83)} tone={tone} label="mesma amplitude" labelSide="left" dashed />
      <Guide x1={300} y1={Y(83)} x2={406} y2={Y(83)} tone={tone} />
      <Label x={296} y={flip ? Y(83) + 24 : Y(83) - 14} anchor="end" tone={tone}>
        {flip ? 'Rompimento provável ↓' : 'Rompimento provável ↑'}
      </Label>
    </DiagramFrame>
  );
}

/* ---------- Bandeira ---------- */
export function Flag({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bear' : 'bull';
  return (
    <DiagramFrame
      caption={
        flip
          ? 'Bandeira de baixa — o mastro (antes da bandeira) tem o MESMO tamanho da projeção do Alvo 2 depois do rompimento.'
          : 'Bandeira de alta — o mastro (antes da bandeira) tem o MESMO tamanho da projeção do Alvo 2 depois do rompimento.'
      }
    >
      <Price
        points={pts('14,244 30,236 52,202 74,174 96,152 110,142 128,160 146,152 164,168 182,160 196,174 210,152 228,124 252,102 280,80 310,64 340,56 372,52 406,50', flip)}
      />
      {/* canal da bandeira */}
      <Guide x1={112} y1={Y(138)} x2={214} y2={Y(158)} tone="muted" />
      <Guide x1={116} y1={Y(168)} x2={218} y2={Y(188)} tone="muted" />
      {/* mastro e sua cópia */}
      <Measure x={22} y1={Y(142)} y2={Y(236)} tone={tone} label="mastro" labelSide="right" />
      <Measure x={302} y1={Y(48)} y2={Y(142)} tone={tone} label="mesmo tamanho" labelSide="left" dashed />
      <Guide x1={240} y1={Y(48)} x2={406} y2={Y(48)} tone={tone} />
      <Guide x1={240} y1={Y(122)} x2={330} y2={Y(122)} tone={tone} />
      <Label x={336} y={Y(126)} tone={tone}>Alvo 1</Label>
      <Label x={404} y={Y(36)} anchor="end" tone={tone}>Alvo 2</Label>
      <Label x={132} y={Y(212)} tone="violet">Bandeira</Label>
    </DiagramFrame>
  );
}

/* ---------- Flâmula ---------- */
export function Pennant({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bear' : 'bull';
  return (
    <DiagramFrame
      caption={
        flip
          ? 'Flâmula de baixa — o mastro anterior tende a gerar um movimento de tamanho parecido depois do rompimento.'
          : 'Flâmula de alta — o mastro anterior tende a gerar um movimento de tamanho parecido depois do rompimento.'
      }
    >
      <Price
        points={pts('14,244 30,236 52,202 74,174 96,152 110,142 130,178 148,152 164,174 178,158 192,168 202,160 214,152 240,120 268,94 300,74 336,60 372,54 406,50', flip)}
      />
      <Guide x1={112} y1={Y(140)} x2={216} y2={Y(160)} tone="muted" />
      <Guide x1={114} y1={Y(184)} x2={216} y2={Y(164)} tone="muted" />
      <Measure x={22} y1={Y(142)} y2={Y(236)} tone={tone} label="mastro" labelSide="right" />
      <Measure x={302} y1={Y(48)} y2={Y(142)} tone={tone} label="mesmo tamanho" labelSide="left" dashed />
      <Guide x1={240} y1={Y(48)} x2={406} y2={Y(48)} tone={tone} />
      <Guide x1={240} y1={Y(122)} x2={330} y2={Y(122)} tone={tone} />
      <Label x={336} y={Y(126)} tone={tone}>Alvo 1</Label>
      <Label x={404} y={Y(36)} anchor="end" tone={tone}>Alvo 2</Label>
      <Label x={132} y={Y(214)} tone="violet">Flâmula</Label>
    </DiagramFrame>
  );
}

/* ---------- Triângulo Simétrico ---------- */
export function SymmetricTriangle({ flip = false }: D) {
  const Y = mk(flip);
  const tone = flip ? 'bear' : 'bull';
  return (
    <DiagramFrame
      caption={
        flip
          ? 'Triângulo simétrico após perna de baixa — bilateral. A abertura do triângulo é replicada a partir do rompimento.'
          : 'Triângulo simétrico após perna de alta — bilateral. A abertura do triângulo é replicada a partir do rompimento.'
      }
    >
      <Price
        points={pts('14,215 40,198 70,172 100,138 124,96 152,180 180,116 208,164 232,130 254,156 274,140 292,146 306,126 330,90 366,66 406,50', flip)}
      />
      <Guide x1={124} y1={Y(96)} x2={330} y2={Y(150)} tone="muted" />
      <Guide x1={152} y1={Y(180)} x2={330} y2={Y(156)} tone="muted" />
      <Measure x={138} y1={Y(100)} y2={Y(178)} tone={tone} label="abertura" labelSide="left" />
      <Measure x={348} y1={Y(134)} y2={Y(56)} tone={tone} label="mesma abertura" labelSide="left" dashed />
      <Guide x1={320} y1={Y(56)} x2={406} y2={Y(56)} tone={tone} />
      <Label x={196} y={Y(64)}>Topos descendo</Label>
      <Label x={196} y={Y(212)}>Fundos subindo</Label>
      <Label x={404} y={Y(40)} anchor="end" tone={tone}>Alvo 1 = abertura</Label>
    </DiagramFrame>
  );
}

/* ---------- Pivô ---------- */
export function Pivot() {
  return (
    <DiagramFrame caption="Pivô de alta: o preço sobe, faz um topo, recua — e o FUNDO do recuo para exatamente no nível do topo anterior, sem perdê-lo. Só então continua subindo.">
      <Price points="20,232 56,196 90,160 112,178 130,160 150,124 172,110 190,112 214,140 240,158 250,160 272,132 300,104 330,84 356,108 372,110 392,88 406,74" />
      {/* régua do topo A, onde o recuo seguinte para */}
      <Guide x1={90} y1={160} x2={262} y2={160} />
      <Guide x1={190} y1={112} x2={382} y2={112} />
      <Dot x={90} y={160} tone="violet" />
      <Dot x={250} y={160} tone="bull" />
      <Dot x={190} y={112} tone="violet" />
      <Dot x={366} y={111} tone="bull" />
      <Label x={22} y={188}>Impulso</Label>
      <Label x={96} y={152} tone="violet">Topo anterior</Label>
      <Label x={196} y={104} tone="violet">Topo seguinte</Label>
      <Label x={182} y={200} tone="bull">Fundo do recuo para no topo anterior</Label>
      <Label x={210} y={250} anchor="middle" tone="bull">O padrão se repete a cada nova perna</Label>
    </DiagramFrame>
  );
}

/* ---------- Rompimento falso ---------- */
export function FalseBreak() {
  return (
    <DiagramFrame caption="Rompimento falso: varre a liquidez abaixo do nível óbvio e só então faz o movimento real.">
      <Price points="14,80 50,126 92,172 132,196 172,186 210,198 240,222 262,196 296,156 330,120 366,88 406,62" />
      <Guide x1={14} y1={196} x2={406} y2={196} />
      <Label x={16} y={188} tone="violet">Suporte do padrão</Label>
      <Dot x={240} y={222} tone="amber" />
      <Label x={214} y={244} tone="bear">Stop hunt</Label>
      <Arrow x={386} y1={160} y2={80} tone="bull" />
      <Label x={378} y={70} anchor="end" tone="bull">Movimento real</Label>
    </DiagramFrame>
  );
}

/* ---------- Fibonacci: Extensão (3 cliques) ---------- */
export function FibExtension({ flip = false }: D) {
  const h = 340;
  const Y = mk(flip, h);
  const base = 230; // nível 0 = TOPO (clique 2)
  const u = 42; // 1.0 = uma perna
  const levels: Array<[number, string]> = [
    [0, '0'],
    [0.618, '0,618'],
    [1, '1'],
    [1.618, '1,618'],
    [2.272, '2,272'],
    [2.618, '2,618'],
    [3.272, '3,272'],
    [4.236, '4,236'],
  ];
  const price = flip
    ? '14,40 40,58 60,50 76,76 100,94 120,104 132,110 150,98 164,93 186,126 210,154 240,180 270,202 300,224 340,244 380,252 406,256'
    : '14,300 40,282 60,290 76,264 100,246 120,236 132,230 150,242 164,247 186,214 210,186 240,160 270,138 300,116 340,96 380,88 406,84';
  return (
    <DiagramFrame
      w={420}
      h={h}
      caption={
        flip
          ? 'Extensão para SHORT: clique 1 no topo, 2 no fundo, 3 no pullback. O nível 0 sai do FUNDO (clique 2) e os níveis abaixo dele são os alvos.'
          : 'Extensão para LONG: clique 1 no fundo, 2 no topo, 3 no pullback. O nível 0 sai do TOPO (clique 2) — o pullback só serve de referência para desenhar.'
      }
    >
      {levels.map(([r, label]) => {
        const y = flip ? h - (base - r * u) : base - r * u;
        return (
          <g key={label}>
            <line x1={170} y1={y} x2={340} y2={y} className="stroke-violet-400/50" strokeWidth={1} strokeDasharray="5 4" />
            <text x={346} y={y + 4} className="fill-violet-300" style={{ fontSize: 12, fontWeight: 500 }}>
              {label}
            </text>
          </g>
        );
      })}
      <Price points={price} />
      <Dot x={76} y={Y(264)} tone="bull" />
      <Dot x={132} y={Y(230)} tone="violet" />
      <Dot x={164} y={Y(247)} tone="bull" />
      <Label x={14} y={Y(284)} tone="bull">{flip ? '1 · topo' : '1 · fundo'}</Label>
      <Label x={86} y={Y(216)} tone="violet">{flip ? '2 · fundo (nível 0)' : '2 · topo (nível 0)'}</Label>
      <Label x={150} y={Y(272)} tone="bull">3 · pullback</Label>
    </DiagramFrame>
  );
}

/* ---------- Fibonacci: Retração ---------- */
export function FibRetracement({ flip = false }: D) {
  const h = 290;
  // flip=false: depois de uma QUEDA — traça do topo (0) para o fundo (1).
  // flip=true: depois de uma ALTA — traça do fundo (0) para o topo (1).
  const a = 56; // origem (nível 0)
  const b = 236; // extremo (nível 1)
  const at = (r: number) => (flip ? b - r * (b - a) : a + r * (b - a));
  const levels: Array<[number, string]> = [
    [0, '0'],
    [0.382, '0,382'],
    [0.5, '0,5'],
    [0.618, '0,618'],
    [0.786, '0,786'],
    [1, '1'],
  ];
  const price = flip
    ? '14,236 44,214 70,224 100,180 130,132 160,84 180,56 202,88 224,112 244,130 262,144 282,124 306,100 336,74 372,60 406,52'
    : '14,56 44,78 70,68 100,112 130,160 160,208 180,236 202,204 224,180 244,162 262,148 282,168 306,192 336,218 372,232 406,240';
  return (
    <DiagramFrame
      w={420}
      h={h}
      caption={
        flip
          ? 'Depois de uma ALTA: traça do fundo (0) para o topo (1). Os níveis marcam até onde a correção tende a ir — 0,5 e 0,618 são o coração da faixa de reação.'
          : 'Depois de uma QUEDA: traça do topo (0) para o fundo (1). Os níveis marcam até onde o repique tende a ir — 0,5 e 0,618 são o coração da faixa de reação.'
      }
    >
      {/* faixa central 0,5 – 0,618 destacada */}
      <rect
        x={180}
        y={Math.min(at(0.5), at(0.618))}
        width={160}
        height={Math.abs(at(0.618) - at(0.5))}
        className="fill-violet-400/10"
      />
      {levels.map(([r, label]) => (
        <g key={label}>
          <line x1={180} y1={at(r)} x2={340} y2={at(r)} className="stroke-violet-400/50" strokeWidth={1} strokeDasharray="5 4" />
          <text x={346} y={at(r) + 4} className="fill-violet-300" style={{ fontSize: 13, fontWeight: 500 }}>
            {label}
          </text>
        </g>
      ))}
      <Price points={price} />
      <Dot x={14} y={flip ? b : a} tone="violet" />
      <Dot x={180} y={flip ? a : b} tone="violet" />
      <Label x={22} y={flip ? b - 12 : a - 12} tone="violet">{flip ? 'Fundo (0)' : 'Topo (0)'}</Label>
      <Label x={96} y={flip ? a - 12 : b + 20} tone="violet">{flip ? 'Topo (1)' : 'Fundo (1)'}</Label>
    </DiagramFrame>
  );
}

/* ---------- Exemplo prático: falso rompimento no triângulo descendente ---------- */
export function FalseBreakTriangle() {
  return (
    <DiagramFrame
      w={420}
      h={280}
      caption="O preço sai ACIMA da LTA (bolinha âmbar), falha, volta para dentro do triângulo e desaba pelo suporte plano. O reteste marcado é a entrada."
    >
      <Guide x1={40} y1={70} x2={310} y2={152} tone="muted" />
      <Guide x1={40} y1={172} x2={300} y2={172} />
      <Price points="14,60 44,152 78,90 112,168 146,116 180,170 212,128 240,168 252,150 262,116 268,110 276,144 288,170 300,192 316,210 332,182 344,190 362,212 386,232 406,244" />
      {/* falso rompimento acima da LTA */}
      <Dot x={265} y={112} tone="amber" r={5.5} />
      <Label x={265} y={96} anchor="middle" tone="bear">Falso rompimento</Label>
      {/* reteste */}
      <Dot x={332} y={182} tone="bear" r={5} />
      <Label x={404} y={168} anchor="end" tone="bear">Reteste / pullback</Label>
      <Label x={46} y={56}>LTA do triângulo</Label>
      <Label x={46} y={192} tone="violet">Suporte plano</Label>
      <Label x={16} y={268}>O suporte rompido vira resistência no reteste</Label>
    </DiagramFrame>
  );
}

/* ---------- Espelhamento de canal ---------- */
export function ChannelMirror() {
  return (
    <DiagramFrame
      w={420}
      h={280}
      caption="Espelhamento: copia o mesmo canal (mesma amplitude e inclinação) a partir do ponto de rompimento. O topo da cópia vira a zona de alvo."
    >
      {/* canal original */}
      <Guide x1={30} y1={215} x2={200} y2={155} tone="muted" />
      <Guide x1={30} y1={175} x2={200} y2={115} tone="muted" />
      {/* canal espelhado a partir do rompimento */}
      <Guide x1={200} y1={115} x2={370} y2={55} tone="violet" />
      <Guide x1={200} y1={75} x2={370} y2={15} tone="violet" />
      <Price points="14,222 40,204 60,214 88,186 106,196 134,168 152,178 180,146 200,124 224,104 248,92 276,74 300,62 330,44 360,30 400,22" />
      <Measure x={112} y1={143} y2={183} tone="violet" label="amplitude" labelSide="left" />
      <Measure x={318} y1={33} y2={73} tone="violet" label="mesma amplitude" labelSide="left" dashed />
      <Dot x={200} y={124} tone="bull" />
      <Label x={128} y={232}>Canal original</Label>
      <Label x={210} y={272} anchor="middle" tone="violet">Cópia espelhada a partir do rompimento</Label>
      <Label x={14} y={250} tone="bull">Rompimento</Label>
    </DiagramFrame>
  );
}

/* ---------- Parciais por espelhamento sucessivo ---------- */
export function SuccessiveMirror() {
  return (
    <DiagramFrame
      w={420}
      h={280}
      caption="A cada nova consolidação, espelha de novo a mesma figura: parcial na metade da projeção e outra no fim. Repete enquanto a tendência durar."
    >
      <Price points="14,248 70,192 110,202 150,158 180,120 220,132 262,90 300,58 340,70 372,44 406,24" />
      {/* projeção 1 */}
      <Guide x1={110} y1={202} x2={180} y2={120} tone="violet" />
      <Dot x={145} y={161} tone="violet" />
      <Dot x={180} y={120} tone="bull" />
      <Label x={110} y={186} tone="violet" size={12}>metade</Label>
      <Label x={150} y={112} tone="bull" size={12}>fim (parcial)</Label>
      {/* projeção 2 */}
      <Guide x1={220} y1={132} x2={300} y2={58} tone="violet" />
      <Dot x={260} y={95} tone="violet" />
      <Dot x={300} y={58} tone="bull" />
      <Label x={222} y={118} tone="violet" size={12}>metade</Label>
      <Label x={262} y={50} tone="bull" size={12}>fim (parcial)</Label>
      {/* projeção 3 */}
      <Guide x1={340} y1={70} x2={406} y2={24} tone="violet" />
      <Dot x={373} y={47} tone="violet" />
      <Label x={404} y={232} anchor="end" tone="violet" size={12}>e assim por diante</Label>
      <Label x={16} y={224}>Consolidação 1</Label>
      <Label x={196} y={166}>Consolidação 2</Label>
      <Label x={310} y={100}>Consolidação 3</Label>
      <Label x={16} y={270}>Cada consolidação repete a figura — e a escada de saídas</Label>
    </DiagramFrame>
  );
}
