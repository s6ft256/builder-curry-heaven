export function CrossTab({ matrix, rows, cols }: { matrix: number[][]; rows: string[]; cols: string[] }) {
  const r = rows.length, c = cols.length;
  const max = Math.max(1, ...matrix.flat());
  const color = (v: number) => {
    const t = v / max;
    const h = 200; // teal
    const s = 70;
    const l = 12 + t * 50;
    return `hsl(${h} ${s}% ${l}%)`;
  };
  return (
    <div className="overflow-auto border rounded-md">
      <div className="min-w-max">
        <div className="grid" style={{ gridTemplateColumns: `160px repeat(${c}, 64px)` }}>
          <div />
          {cols.map((cc) => (
            <div key={cc} className="text-xs text-center px-1 py-1 border-b">{cc}</div>
          ))}
          {rows.map((rr, i) => (
            <>
              <div key={`r-${rr}`} className="text-xs text-right border-r px-2 py-1">{rr}</div>
              {cols.map((cc, j) => (
                <div key={`c-${i}-${j}`} className="h-8 w-16 flex items-center justify-center text-xs" style={{ background: color(matrix[i][j]) }}>
                  {matrix[i][j]}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

export function buildCrossTab(data: { a: string; b: string }[]) {
  const rowKeys = Array.from(new Set(data.map((d) => d.a)));
  const colKeys = Array.from(new Set(data.map((d) => d.b)));
  const indexR = new Map(rowKeys.map((k, i) => [k, i] as const));
  const indexC = new Map(colKeys.map((k, i) => [k, i] as const));
  const matrix = Array.from({ length: rowKeys.length }, () => Array(colKeys.length).fill(0));
  for (const d of data) {
    matrix[indexR.get(d.a)!][indexC.get(d.b)!]++;
  }
  return { matrix, rows: rowKeys, cols: colKeys };
}
