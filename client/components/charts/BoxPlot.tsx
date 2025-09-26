import { useMemo } from "react";

export function BoxPlot({ data, height = 120, color = "hsl(var(--primary))" }: { data: number[]; height?: number; color?: string }) {
  const stats = useMemo(() => computeBox(data), [data]);
  if (!stats) return <div className="text-sm text-muted-foreground">Not enough data</div>;

  const { min, max, q1, q3, median } = stats;
  const pad = 24;
  const w = 560;
  const h = height;
  const scale = (v: number) => pad + ((v - min) / (max - min || 1)) * (w - pad * 2);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <line x1={scale(min)} x2={scale(max)} y1={h / 2} y2={h / 2} stroke="currentColor" className="opacity-30" />
      <rect x={scale(q1)} y={h / 2 - 24} width={scale(q3) - scale(q1)} height={48} fill={color} opacity={0.25} stroke={color} />
      <line x1={scale(median)} x2={scale(median)} y1={h / 2 - 26} y2={h / 2 + 26} stroke={color} />
      <line x1={scale(min)} x2={scale(q1)} y1={h / 2} y2={h / 2} stroke={color} />
      <line x1={scale(q3)} x2={scale(max)} y1={h / 2} y2={h / 2} stroke={color} />
      <line x1={scale(min)} x2={scale(min)} y1={h / 2 - 14} y2={h / 2 + 14} stroke={color} />
      <line x1={scale(max)} x2={scale(max)} y1={h / 2 - 14} y2={h / 2 + 14} stroke={color} />
    </svg>
  );
}

function computeBox(data: number[]) {
  const arr = data.filter((d) => isFinite(d)).sort((a, b) => a - b);
  if (arr.length < 5) return null as any;
  const q = (p: number) => {
    const pos = (arr.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    return arr[base] + (arr[base + 1] - arr[base]) * rest || arr[base];
  };
  return { min: arr[0], q1: q(0.25), median: q(0.5), q3: q(0.75), max: arr[arr.length - 1] };
}
