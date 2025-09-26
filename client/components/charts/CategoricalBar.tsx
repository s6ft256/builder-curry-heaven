import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function CategoricalBar({
  values,
  color = "#0891b2",
}: {
  values: Record<string, number>;
  color?: string;
}) {
  const data = useMemo(
    () => Object.entries(values).map(([name, count]) => ({ name, count })),
    [values],
  );
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          margin={{ left: 8, right: 8, top: 8, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 10 }}
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count">
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Bar>
        </BarChart>
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
];
