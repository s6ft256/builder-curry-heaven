import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function Histogram({
  data,
  color = "#4f46e5",
  bins = 20,
  height = 260,
}: {
  data: number[];
  color?: string;
  bins?: number;
  height?: number;
}) {
  const hist = useMemo(() => {
    const arr = data.filter((d) => isFinite(d));
    if (!arr.length) return [] as { x0: number; x1: number; count: number }[];
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const step = (max - min) / (bins || 20) || 1;
    const buckets = Array.from({ length: bins }, (_, i) => ({
      x0: min + i * step,
      x1: min + (i + 1) * step,
      count: 0,
    }));
    for (const v of arr) {
      const idx = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / step)));
      buckets[idx].count++;
    }
    return buckets.map((b) => ({
      label: `${round(b.x0)} - ${round(b.x1)}`,
      count: b.count,
    }));
  }, [data, bins]);

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={hist} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval={Math.max(0, Math.floor((hist.length - 1) / 6))}
            angle={-30}
            height={50}
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function round(n: number) {
  const p = Math.pow(10, 2);
  return Math.round(n * p) / p;
}
