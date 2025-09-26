import { useMemo } from "react";
import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
} from "recharts";
import { Row } from "@/lib/excel";

export function ScatterPlotMatrix({
  rows,
  columns,
  size = 180,
}: {
  rows: Row[];
  columns: string[];
  size?: number;
}) {
  const cols = useMemo(() => columns.slice(0, 4), [columns]);
  const data = useMemo(() => rows.map((r) => r), [rows]);

  if (cols.length < 2)
    return (
      <div className="text-sm text-muted-foreground">
        Not enough numeric columns
      </div>
    );

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${cols.length}, minmax(160px, 1fr))`,
      }}
    >
      {cols.map((x) =>
        cols.map((y) => (
          <div key={`${x}-${y}`} className="border rounded-md p-2">
            <div className="text-xs text-muted-foreground mb-1">
              {x} vs {y}
            </div>
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height={size}>
                <ScatterChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={x}
                    name={x}
                    type="number"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    dataKey={y}
                    name={y}
                    type="number"
                    tick={{ fontSize: 10 }}
                  />
                  <ZAxis range={[50]} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter
                    data={data}
                    fill="hsl(var(--primary))"
                    opacity={0.5}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )),
      )}
    </div>
  );
}
