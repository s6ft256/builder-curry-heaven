export function CorrelationHeatmap({
  matrix,
  height = 320,
}: {
  matrix: { columns: string[]; values: number[][] };
  height?: number;
}) {
  const cols = matrix.columns;
  const n = cols.length;
  const size = Math.max(18, Math.min(52, Math.floor(520 / Math.max(1, n))));

  const color = (v: number) => {
    // -1 blue -> 0 white -> 1 red
    const r = v > 0 ? Math.round(v * 200 + 30) : 30;
    const b = v < 0 ? Math.round(-v * 200 + 30) : 30;
    const g = 40;
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div className="overflow-auto border rounded-lg">
      <div className="min-w-max p-2">
        <div
          className="grid"
          style={{ gridTemplateColumns: `160px repeat(${n}, ${size}px)` }}
        >
          <div />
          {cols.map((c) => (
            <div
              key={c}
              className="text-xs text-center px-1 whitespace-nowrap"
              style={{ width: size }}
            >
              {c}
            </div>
          ))}
          {cols.map((rowC, i) => (
            <>
              <div
                key={`r-${rowC}`}
                className="text-xs whitespace-nowrap pr-2 text-right flex items-center"
                style={{ height: size }}
              >
                {rowC}
              </div>
              {cols.map((colC, j) => (
                <div
                  key={`cell-${i}-${j}`}
                  title={`${rowC} vs ${colC}: ${matrix.values[i][j].toFixed(2)}`}
                  className="border"
                  style={{
                    width: size,
                    height: size,
                    background: color(matrix.values[i][j]),
                  }}
                />
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
