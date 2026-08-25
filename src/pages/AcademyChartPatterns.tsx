import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { SEO } from '@/components/SEO';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Compass, TrendingUp, Target, Layers } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hsl(name: string, alpha = 1): string {
  const v = cssVar(name);
  return alpha === 1 ? `hsl(${v})` : `hsl(${v} / ${alpha})`;
}

function useThemeVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return version;
}

function useCanvasDraw(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const themeVersion = useThemeVersion();
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const render = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      drawRef.current(ctx, rect.width, rect.height);
    };

    render();
    const ro = new ResizeObserver(render);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [themeVersion]);

  return ref;
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = hsl('--border', 0.6);
  ctx.lineWidth = 0.6;
  for (let x = 0; x < w; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function labelStyle(ctx: CanvasRenderingContext2D, color: string) {
  ctx.font = '600 10px "JetBrains Mono", monospace';
  ctx.fillStyle = color;
}

function CanvasIllustration({
  draw,
  heightClass = 'h-52',
}: {
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  heightClass?: string;
}) {
  const ref = useCanvasDraw(draw);
  return (
    <div className={`w-full ${heightClass} relative`}>
      <canvas ref={ref} className="w-full h-full block" />
    </div>
  );
}

function drawMethodA(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.strokeStyle = hsl('--electric-blue');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.25);
  ctx.lineTo(w * 0.75, h * 0.45);
  ctx.stroke();

  ctx.strokeStyle = hsl('--apple-green');
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.55);
  ctx.lineTo(w * 0.75, h * 0.75);
  ctx.stroke();

  ctx.strokeStyle = hsl('--foreground');
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.85);
  ctx.lineTo(w * 0.15, h * 0.25);
  ctx.lineTo(w * 0.35, h * 0.61);
  ctx.lineTo(w * 0.5, h * 0.36);
  ctx.lineTo(w * 0.65, h * 0.72);
  ctx.lineTo(w * 0.85, h * 0.15);
  ctx.stroke();

  ctx.fillStyle = hsl('--apple-green');
  ctx.beginPath();
  ctx.arc(w * 0.65, h * 0.72, 6, 0, Math.PI * 2);
  ctx.fill();

  labelStyle(ctx, hsl('--apple-green'));
  ctx.fillText('ENTRADA A (Piso)', w * 0.62, h * 0.85);

  ctx.fillStyle = hsl('--apple-orange');
  ctx.fillRect(w * 0.62, h * 0.88, 12, 12);
}

function drawMethodB(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.strokeStyle = hsl('--apple-cyan');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.35);
  ctx.lineTo(w * 0.6, h * 0.35);
  ctx.stroke();

  ctx.strokeStyle = hsl('--foreground');
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.75);
  ctx.lineTo(w * 0.25, h * 0.35);
  ctx.lineTo(w * 0.4, h * 0.6);
  ctx.lineTo(w * 0.6, h * 0.18);
  ctx.lineTo(w * 0.72, h * 0.35);
  ctx.lineTo(w * 0.9, h * 0.1);
  ctx.stroke();

  ctx.fillStyle = hsl('--apple-cyan');
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.35, 6, 0, Math.PI * 2);
  ctx.fill();

  labelStyle(ctx, hsl('--apple-cyan'));
  ctx.fillText('ENTRADA B (Reteste)', w * 0.65, h * 0.48);

  ctx.fillStyle = hsl('--apple-cyan');
  ctx.fillRect(w * 0.58, h * 0.82, 10, 18);
}

function drawHtfCard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.strokeStyle = hsl('--apple-green');
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.85);
  ctx.lineTo(w * 0.35, h * 0.2);
  ctx.stroke();

  ctx.strokeStyle = hsl('--electric-blue');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.35, h * 0.2);
  ctx.lineTo(w * 0.75, h * 0.25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.35, h * 0.38);
  ctx.lineTo(w * 0.75, h * 0.43);
  ctx.stroke();

  ctx.strokeStyle = hsl('--foreground');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.35, h * 0.2);
  ctx.lineTo(w * 0.45, h * 0.38);
  ctx.lineTo(w * 0.58, h * 0.22);
  ctx.lineTo(w * 0.75, h * 0.12);
  ctx.stroke();
}

function drawFallingCard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.strokeStyle = hsl('--apple-cyan');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.15);
  ctx.lineTo(w * 0.7, h * 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.45);
  ctx.lineTo(w * 0.7, h * 0.7);
  ctx.stroke();

  ctx.strokeStyle = hsl('--foreground');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.45);
  ctx.lineTo(w * 0.25, h * 0.25);
  ctx.lineTo(w * 0.45, h * 0.58);
  ctx.lineTo(w * 0.65, h * 0.38);
  ctx.lineTo(w * 0.85, h * 0.1);
  ctx.stroke();
}

function drawAscTriangleCard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.strokeStyle = hsl('--electric-blue');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.25);
  ctx.lineTo(w * 0.7, h * 0.25);
  ctx.stroke();

  ctx.strokeStyle = hsl('--apple-green');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.75);
  ctx.lineTo(w * 0.7, h * 0.25);
  ctx.stroke();

  ctx.strokeStyle = hsl('--foreground');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.75);
  ctx.lineTo(w * 0.3, h * 0.25);
  ctx.lineTo(w * 0.45, h * 0.45);
  ctx.lineTo(w * 0.6, h * 0.25);
  ctx.lineTo(w * 0.85, h * 0.08);
  ctx.stroke();
}

function drawSymTriangleCard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.strokeStyle = hsl('--electric-blue');
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.15);
  ctx.lineTo(w * 0.7, h * 0.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.75);
  ctx.lineTo(w * 0.7, h * 0.45);
  ctx.stroke();

  ctx.strokeStyle = hsl('--foreground');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.75);
  ctx.lineTo(w * 0.25, h * 0.22);
  ctx.lineTo(w * 0.45, h * 0.62);
  ctx.lineTo(w * 0.65, h * 0.35);
  ctx.lineTo(w * 0.85, h * 0.15);
  ctx.stroke();
}

function drawBullFlagCard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.strokeStyle = hsl('--apple-green');
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.85);
  ctx.lineTo(w * 0.3, h * 0.2);
  ctx.stroke();

  ctx.strokeStyle = hsl('--apple-orange');
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.2);
  ctx.lineTo(w * 0.7, h * 0.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.4);
  ctx.lineTo(w * 0.7, h * 0.65);
  ctx.stroke();

  ctx.strokeStyle = hsl('--foreground');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.2);
  ctx.lineTo(w * 0.45, h * 0.5);
  ctx.lineTo(w * 0.6, h * 0.38);
  ctx.lineTo(w * 0.85, h * 0.1);
  ctx.stroke();
}

function drawRisingWedgeCard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.strokeStyle = hsl('--apple-red');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.75);
  ctx.lineTo(w * 0.7, h * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.9);
  ctx.lineTo(w * 0.7, h * 0.28);
  ctx.stroke();

  ctx.strokeStyle = hsl('--foreground');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.9);
  ctx.lineTo(w * 0.3, h * 0.55);
  ctx.lineTo(w * 0.5, h * 0.35);
  ctx.lineTo(w * 0.65, h * 0.22);
  ctx.lineTo(w * 0.85, h * 0.85);
  ctx.stroke();
}

function drawTrapDiagram(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  ctx.strokeStyle = hsl('--apple-red');
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.55);
  ctx.lineTo(w * 0.9, h * 0.55);
  ctx.stroke();
  ctx.setLineDash([]);

  const cx = w * 0.5;
  ctx.strokeStyle = hsl('--apple-green');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.35);
  ctx.lineTo(cx, h * 0.85);
  ctx.stroke();

  ctx.fillStyle = hsl('--apple-green');
  ctx.fillRect(cx - 8, h * 0.4, 16, 20);

  labelStyle(ctx, hsl('--apple-red'));
  ctx.fillText('⚡ Liquidez de Stops Capturada', cx - 78, h * 0.94);

  ctx.strokeStyle = hsl('--apple-cyan');
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx + 8, h * 0.45);
  ctx.lineTo(w * 0.85, h * 0.15);
  ctx.stroke();
}

function drawGannFan(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  drawGrid(ctx, w, h);

  const ox = w * 0.1;
  const oy = h * 0.85;
  const angles = [
    { label: '8x1 (7.5°)', angleDeg: 7.5, colorVar: '--electric-blue' as const },
    { label: '2x1 (26.25°)', angleDeg: 26.25, colorVar: '--apple-green' as const },
    { label: '1x1 (45°) EQUILÍBRIO', angleDeg: 45, colorVar: '--apple-cyan' as const, width: 3 },
    { label: '1x2 (63.75°)', angleDeg: 63.75, colorVar: '--apple-orange' as const },
  ];

  angles.forEach((item) => {
    const rad = (item.angleDeg * Math.PI) / 180;
    const length = w * 0.85;
    const targetX = ox + length * Math.cos(rad);
    const targetY = oy - length * Math.sin(rad);
    const color = hsl(item.colorVar);

    ctx.strokeStyle = color;
    ctx.lineWidth = item.width || 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    labelStyle(ctx, color);
    if (targetX < w && targetY > 0) {
      ctx.fillText(item.label, Math.min(targetX - 45, w - 100), Math.max(targetY - 5, 15));
    }
  });
}

const heroStats = [
  { label: 'Top 1 Padrão Absoluto', value: 'Bandeira HTF', sub: '85% de sucesso em 1D / 4H', colorClass: 'text-apple-green' },
  { label: 'Melhor Estratégia Trap', value: 'Rising Wedge Trap', sub: '79% de acerto no Short', colorClass: 'text-apple-cyan' },
  { label: 'Execução Protegida', value: 'Piso / Reteste', sub: 'Sem ordens a mercado em breakout', colorClass: 'text-apple-orange' },
  { label: 'Tempo Gráfico Ideal', value: 'Diário (1D)', sub: 'Filtra ruídos operacionais', colorClass: 'text-primary' },
];

const patterns = [
  {
    id: 'htf',
    title: '1. Bandeira HTF (High & Tight)',
    success: '85% Sucesso',
    badgeClass: 'bg-apple-green/10 text-apple-green border-apple-green/20',
    description: 'Mastro explosivo (>90%) seguido de consolidação estreita com retração <20%.',
    draw: drawHtfCard,
    stats: [
      ['Inclinação', '< 15° (Rasa)'],
      ['Janela Ideal', '1D e 4H'],
    ],
  },
  {
    id: 'falling',
    title: '2. Cunha Descendente',
    success: '68% Sucesso',
    badgeClass: 'bg-apple-cyan/10 text-apple-cyan border-apple-cyan/20',
    description: 'Canal afunilado para baixo com exaustão vendedora no vértice e molas de liquidez.',
    draw: drawFallingCard,
    stats: [
      ['Convergência', 'Ângulo 60°-90°'],
      ['Janela Ideal', '1D e 4H'],
    ],
  },
  {
    id: 'asc-tri',
    title: '3. Triângulo Ascendente',
    success: '67% Sucesso',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
    description: 'Resistência horizontal plana combinada com linha de tendência de alta (fundos mais altos).',
    draw: drawAscTriangleCard,
    stats: [
      ['Topo', 'Estático (m=0)'],
      ['Janela Ideal', '4H e 1H'],
    ],
  },
  {
    id: 'sym-tri',
    title: '4. Triângulo Simétrico',
    success: '67% Sucesso',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
    description: 'Compressão espelhada de volatilidade com convergência simétrica de topos e fundos.',
    draw: drawSymTriangleCard,
    stats: [
      ['Vértice', 'Ponto neutro'],
      ['Janela Ideal', '4H e 1H'],
    ],
  },
  {
    id: 'bull-flag',
    title: '5. Bandeira de Alta Clássica',
    success: '56% Sucesso',
    badgeClass: 'bg-apple-orange/10 text-apple-orange border-apple-orange/20',
    description: 'Canal inclinado contra a tendência (até 30°) com retração saudável de 38% a 50%.',
    draw: drawBullFlagCard,
    stats: [
      ['Retração', '38.2% - 50.0%'],
      ['Janela Ideal', '1D e 4H'],
    ],
  },
  {
    id: 'rising-wedge',
    title: '6. Cunha Ascendente',
    success: '51% Alta / 79% Short',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
    description: 'Subida íngreme com perda de fôlego. Péssimo para compras, excelente para Trap Short.',
    draw: drawRisingWedgeCard,
    stats: [
      ['Declive', 'Íngreme (Exhaustion)'],
      ['Estratégia', 'Short na Ruptura'],
    ],
  },
];

const barChartData = [
  { name: 'Bandeira HTF', Tradicional: 85, Trap: 78 },
  { name: 'Cunha Desc.', Tradicional: 68, Trap: 72 },
  { name: 'Tri. Asc.', Tradicional: 67, Trap: 74 },
  { name: 'Tri. Simétrico', Tradicional: 67, Trap: 69 },
  { name: 'Bandeira Clás.', Tradicional: 56, Trap: 76 },
  { name: 'Cunha Asc.', Tradicional: 51, Trap: 79 },
];

const timeframeData = [
  { name: 'Diário (1D)', taxa: 82 },
  { name: '4 Horas', taxa: 75 },
  { name: '1 Hora', taxa: 64 },
  { name: '15 Min', taxa: 48 },
  { name: '5m / 1m', taxa: 28 },
];

const gannRows = [
  { angle: '1x8', ratio: '1 Preço / 8 Tempo', degrees: '82.5° (Baixa)', state: 'Suporte Extremo de Baixa', highlight: false },
  { angle: '1x1', ratio: '1 Preço / 1 Tempo', degrees: '45.0° (Geométrico)', state: 'Linha Principal de Equilíbrio (Bull)', highlight: true },
  { angle: '2x1', ratio: '2 Preço / 1 Tempo', degrees: '26.25°', state: 'Alta Acelerada', highlight: false },
];

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  accentClass = 'border-primary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  accentClass?: string;
}) {
  return (
    <div className={`border-l-4 ${accentClass} pl-4 flex items-start gap-3`}>
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
      </div>
    </div>
  );
}

export default function AcademyChartPatterns() {
  return (
    <>
      <SEO
        title="Chart Patterns & Price Geometry — Academy | The Trading Diary"
        description="Manual ilustrado de padrões gráficos, ângulos de Gann e armadilhas de liquidez, com desenhos técnicos e estatísticas de taxa de sucesso."
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

          <PremiumCard variant="gradient" className="p-6 lg:p-8" contentClassName="p-0">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-apple-cyan uppercase tracking-wider bg-apple-cyan/10 px-3 py-1 rounded-md border border-apple-cyan/20">
                <Compass className="h-3.5 w-3.5" />
                Manual Ilustrado • Geometria de Ação do Preço
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                Ângulos, Traps e Estruturas de Reteste
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Todas as formações geométricas, técnicas de entrada antirrompimento seco e zonas de liquidez com
                esquemas visuais desenhados em tempo real. Veja os pontos exatos de entrada, stops e comportamento
                de volume.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-background/60 border border-border rounded-xl p-4 flex flex-col justify-between"
                >
                  <div className="text-xs font-mono text-muted-foreground uppercase">{stat.label}</div>
                  <div className={`text-lg lg:text-xl font-extrabold font-mono my-1 ${stat.colorClass}`}>
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{stat.sub}</div>
                </div>
              ))}
            </div>
          </PremiumCard>

          <section className="space-y-6">
            <SectionHeading
              icon={Target}
              accentClass="border-apple-orange"
              title="Ilustração Prática dos Métodos de Entrada (Sem Rompimento Seco)"
              subtitle="Anatomia exata de onde posicionar ordens, stops, e como interpretar o volume footprint."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PremiumCard className="p-6 space-y-4 flex flex-col justify-between" contentClassName="p-0 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
                    <span className="font-mono text-xs font-bold text-apple-green uppercase tracking-wider bg-apple-green/10 px-3 py-1 rounded border border-apple-green/20">
                      Desenho A: Entrada Antecipada
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">Risco/Retorno &gt; 1:4</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">Comprar no Suporte/Piso com Seca de Volume</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Entrada realizada diretamente no toque do suporte da consolidação. O gatilho é a desidratação do
                    volume vendedor (barras amarelas).
                  </p>
                </div>
                <div className="bg-background rounded-xl p-2 border border-border">
                  <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground px-2 py-1">
                    <span>Esquema Visual: Entrada no Piso da Consolidação</span>
                    <span className="text-apple-green">Método A</span>
                  </div>
                  <CanvasIllustration draw={drawMethodA} />
                </div>
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border text-xs space-y-1 font-mono">
                  <div className="text-apple-green font-bold">● Entrada: no toque da linha inferior com volume amarelo</div>
                  <div className="text-destructive">● Stop-Loss: logo abaixo do suporte da figura</div>
                </div>
              </PremiumCard>
              <PremiumCard className="p-6 space-y-4 flex flex-col justify-between" contentClassName="p-0 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
                    <span className="font-mono text-xs font-bold text-apple-cyan uppercase tracking-wider bg-apple-cyan/10 px-3 py-1 rounded border border-apple-cyan/20">
                      Desenho B: Entrada Confirmada
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">Taxa de Acerto &gt; 78%</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">Comprar Apenas no Throwback</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    O preço rompe com volume azul e recua suavemente. Compra-se quando a resistência rompida se
                    confirma como suporte sustentado.
                  </p>
                </div>
                <div className="bg-background rounded-xl p-2 border border-border">
                  <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground px-2 py-1">
                    <span>Esquema Visual: Throwback &amp; Validação por Volume</span>
                    <span className="text-apple-cyan">Método B</span>
                  </div>
                  <CanvasIllustration draw={drawMethodB} />
                </div>
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border text-xs space-y-1 font-mono">
                  <div className="text-apple-cyan font-bold">● Entrada: no toque de reteste após o pivô de rompimento</div>
                  <div className="text-apple-orange">● Confirmação: volume azul no breakout + volume baixo no pullback</div>
                </div>
              </PremiumCard>
            </div>
          </section>

          <section className="space-y-6">
            <SectionHeading
              icon={Layers}
              accentClass="border-apple-green"
              title="Galeria dos 6 Padrões Gráficos Principais"
              subtitle="Cada card contém o desenho anatômico do padrão: estrutura geométrica, linhas de tendência e comportamento de volume."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {patterns.map((p) => (
                <PremiumCard key={p.id} className="p-5 space-y-3 flex flex-col justify-between" contentClassName="p-0 space-y-3 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-2 gap-2">
                      <h4 className="font-bold text-sm text-foreground">{p.title}</h4>
                      <Badge variant="outline" className={`text-[10px] font-mono shrink-0 ${p.badgeClass}`}>
                        {p.success}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{p.description}</p>
                  </div>
                  <div className="bg-background rounded-lg p-1.5 border border-border">
                    <CanvasIllustration draw={p.draw} heightClass="h-40" />
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground space-y-1">
                    {p.stats.map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>{k}:</span>
                        <span className="text-foreground font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                </PremiumCard>
              ))}
            </div>
          </section>
        </div>
      </AppLayout>
    </>
  );
}
