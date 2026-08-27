import React from 'react';

/**
 * Diagramas SVG em linha para a lição de Padrões Gráficos.
 * Paleta: acento roxo/índigo do produto + verde/vermelho apenas para viés direcional.
 * viewBox padrão: 320 x 180.
 */

const W = 320;
const H = 180;

export function DiagramFrame({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={caption || 'Diagrama do padrão'}>
        {/* grade */}
        {[36, 72, 108, 144].map((y) => (
          <line key={y} x1={8} y1={y} x2={W - 8} y2={y} className="stroke-indigo-400/10" strokeWidth={1} />
        ))}
        {children}
      </svg>
      {caption && <p className="text-[11px] text-muted-foreground px-1 pt-1">{caption}</p>}
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
  tone?: 'violet' | 'bull' | 'bear' | 'muted';
}) {
  const cls =
    tone === 'bull'
      ? 'stroke-emerald-400'
      : tone === 'bear'
        ? 'stroke-rose-400'
        : tone === 'muted'
          ? 'stroke-muted-foreground/40'
          : 'stroke-violet-400';
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={cls} strokeWidth={1.5} strokeDasharray="5 4" />;
}

export function Label({
  x,
  y,
  children,
  tone = 'muted',
  anchor = 'start',
}: {
  x: number;
  y: number;
  children: string;
  tone?: 'violet' | 'bull' | 'bear' | 'muted';
  anchor?: 'start' | 'middle' | 'end';
}) {
  const cls =
    tone === 'bull'
      ? 'fill-emerald-400'
      : tone === 'bear'
        ? 'fill-rose-400'
        : tone === 'violet'
          ? 'fill-violet-300'
          : 'fill-muted-foreground';
  return (
    <text x={x} y={y} textAnchor={anchor} className={`${cls} text-[9px]`} style={{ fontSize: 9 }}>
      {children}
    </text>
  );
}

/** Seta de direção do movimento esperado após o rompimento */
export function Arrow({ x, y1, y2, tone }: { x: number; y1: number; y2: number; tone: 'bull' | 'bear' }) {
  const cls = tone === 'bull' ? 'stroke-emerald-400 fill-emerald-400' : 'stroke-rose-400 fill-rose-400';
  const dir = y2 > y1 ? 1 : -1;
  return (
    <g className={cls}>
      <line x1={x} y1={y1} x2={x} y2={y2} strokeWidth={2} />
      <polygon points={`${x - 4},${y2 - dir * 6} ${x + 4},${y2 - dir * 6} ${x},${y2}`} strokeWidth={0} />
    </g>
  );
}
