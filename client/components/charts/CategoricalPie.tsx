import { useMemo } from "react";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Legend,
} from "recharts";

export function CategoricalPie({ values }: { values: Record<string, number> }) {
  const data = useMemo(
    () => Object.entries(values).map(([name, value]) => ({ name, value })),
    [values],
  );
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            label={(d) =>
              `${d.name} ${Math.round((d.value / total) * 1000) / 10}%`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

const palette = [
  "#0891b2",
  "#4f46e5",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#10b981",
];
