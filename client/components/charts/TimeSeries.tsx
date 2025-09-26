import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Row } from "@/lib/excel";

export function TimeSeries({
  rows,
  dateColumn,
  numericColumns,
}: {
  rows: Row[];
  dateColumn: string;
  numericColumns: string[];
}) {
  const [selected, setSelected] = useState<string[]>(
    numericColumns.slice(0, 3),
  );

  const data = useMemo(() => {
    const parsed = rows
      .map((r) => ({ ...r, __date: new Date(r[dateColumn]) }))
      .filter((r) => !isNaN(r.__date.getTime()))
      .sort((a, b) => +a.__date - +b.__date)
      .map((r) => ({ ...r, __label: r.__date.toISOString().slice(0, 10) }));
    return parsed;
  }, [rows, dateColumn]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {numericColumns.map((c) => (
          <label key={c} className="text-xs inline-flex items-center gap-1">
            <input
              type="checkbox"
              className="accent-primary"
              checked={selected.includes(c)}
              onChange={(e) =>
                setSelected((prev) =>
                  e.target.checked ? [...prev, c] : prev.filter((x) => x !== c),
                )
              }
            />
            {c}
          </label>
        ))}
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="__label" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            {selected.map((c, i) => (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                stroke={palette[i % palette.length]}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const palette = [
  "#4f46e5",
  "#0891b2",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
];
