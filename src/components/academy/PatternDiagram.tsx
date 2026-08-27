import React from 'react';

/**
 * Primitivas SVG para os diagramas da Academy.
 * Canvas padrão: 420 x 260 (mais largo e alto que a versão antiga, para caber
 * medições e rótulos sem sobrepor as linhas de preço).
 */

const DEFAULT_W = 420;
const DEFAULT_H = 260;

export function DiagramFrame({
  children,
  caption,
  w = DEFAULT_W,
  h = DEFAULT_H,
}: {
  children: React.ReactNode;
  caption?: string;
  w?: number;
  h?: number;
}) {
  const lines = [0.2, 0.4, 0.6, 0.8].map((r) => Math.round(h * r));
  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-3">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-auto"
        role="img"
        aria-label={caption || 'Diagrama do padrão'}
      >
        {lines.map((y) => (
          <line key={y} x1={8} y1={y} x2={w - 8} y2={y} className="stroke-indigo-400/10" strokeWidth={1} />
        ))}
        {children}
      </svg>
      {caption && <p className="text-xs text-muted-foreground px-1 pt-2 leading-snug">{caption}</p>}
    </div>
  );
}

export function Price({ points }: { points: string }) {
  return (
    <polyline
      points={points}
      fill="none"
      className="stroke-indigo-400"
      strokeWidth={2.5}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

type Tone = 'violet' | 'bull' | 'bear' | 'muted' | 'amber';

const strokeFor = (tone: Tone) =>
  tone === 'bull'
    ? 'stroke-emerald-400'
    : tone === 'bear'
      ? 'stroke-rose-400'
      : tone === 'muted'
        ? 'stroke-muted-foreground/40'
        : tone === 'amber'
          ? 'stroke-amber-400'
          : 'stroke-violet-400';

const fillFor = (tone: Tone) =>
  tone === 'bull'
    ? 'fill-emerald-400'
    : tone === 'bear'
      ? 'fill-rose-400'
      : tone === 'amber'
        ? 'fill-amber-400'
        : tone === 'violet'
          ? 'fill-violet-300'
          : 'fill-muted-foreground';

export function Guide({
  x1,
  y1,
  x2,
  y2,
  tone = 'violet',
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tone?: Tone;
}) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={strokeFor(tone)} strokeWidth={1.5} strokeDasharray="6 5" />;
}

export function Label({
  x,
  y,
  children,
  tone = 'muted',
  anchor = 'start',
  size = 13,
}: {
  x: number;
  y: number;
  children: string;
  tone?: Tone;
  anchor?: 'start' | 'middle' | 'end';
  size?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={fillFor(tone)} style={{ fontSize: size, fontWeight: 500 }}>
      {children}
    </text>
  );
}

/** Seta simples de direção */
export function Arrow({ x, y1, y2, tone }: { x: number; y1: number; y2: number; tone: Tone }) {
  const dir = y2 > y1 ? 1 : -1;
  return (
    <g className={`${strokeFor(tone)} ${fillFor(tone)}`}>
      <line x1={x} y1={y1} x2={x} y2={y2} strokeWidth={2.5} />
      <polygon points={`${x - 5},${y2 - dir * 8} ${x + 5},${y2 - dir * 8} ${x},${y2}`} strokeWidth={0} />
    </g>
  );
}

/**
 * Régua de medição vertical: mostra uma distância (altura de padrão) e permite
 * replicar visualmente a MESMA distância no ponto de rompimento.
 */
export function Measure({
  x,
  y1,
  y2,
  tone = 'violet',
  label,
  labelSide = 'right',
  dashed = false,
}: {
  x: number;
  y1: number;
  y2: number;
  tone?: Tone;
  label?: string;
  labelSide?: 'right' | 'left';
  dashed?: boolean;
}) {
  const top = Math.min(y1, y2);
  const bottom = Math.max(y1, y2);
  const mid = (top + bottom) / 2;
  return (
    <g className={`${strokeFor(tone)} ${fillFor(tone)}`}>
      <line
        x1={x}
        y1={top}
        x2={x}
        y2={bottom}
        strokeWidth={2}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      <polygon points={`${x - 4},${top + 8} ${x + 4},${top + 8} ${x},${top}`} strokeWidth={0} />
      <polygon points={`${x - 4},${bottom - 8} ${x + 4},${bottom - 8} ${x},${bottom}`} strokeWidth={0} />
      <line x1={x - 6} y1={top} x2={x + 6} y2={top} strokeWidth={1.5} />
      <line x1={x - 6} y1={bottom} x2={x + 6} y2={bottom} strokeWidth={1.5} />
      {label && (
        <text
          x={labelSide === 'right' ? x + 9 : x - 9}
          y={mid + 4}
          textAnchor={labelSide === 'right' ? 'start' : 'end'}
          className={fillFor(tone)}
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Ponto marcado no gráfico */
export function Dot({ x, y, tone = 'violet', r = 5 }: { x: number; y: number; tone?: Tone; r?: number }) {
  return <circle cx={x} cy={y} r={r} className={fillFor(tone)} />;
}
