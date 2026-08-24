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

export default function AcademyChartPatterns() {
  return (
    <>
      <SEO
        title="Chart Patterns & Price Geometry — Academy | The Trading Diary"
        description="Manual ilustrado de padroes graficos, angulos de Gann e armadilhas de liquidez."
        canonical="https://www.thetradingdiary.com/learn/chart-patterns"
        noindex={true}
      />
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-10 pb-16">
          <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Academy
          </Link>

          <PremiumCard variant="gradient" className="p-6 lg:p-8" contentClassName="p-0">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Angulos, Traps e Estruturas de Reteste
            </h1>
            <p className="text-muted-foreground text-sm mt-2">Carregando conteudo completo na proxima mensagem...</p>
          </PremiumCard>
        </div>
      </AppLayout>
    </>
  );
}
