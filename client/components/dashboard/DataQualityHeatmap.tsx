import { Row } from "@/lib/excel";

export function DataQualityHeatmap({
  rows,
  maxRows = 100,
  maxCols = 30,
}: {
  rows: Row[];
  maxRows?: number;
  maxCols?: number;
}) {
  const columns = rows[0] ? Object.keys(rows[0]).slice(0, maxCols) : [];
  const displayRows = rows.slice(0, maxRows);

  return (
    <div>
      <div className="mb-2 text-sm text-muted-foreground">
        Missing values heatmap (rows × columns)
      </div>
      <div className="overflow-auto border rounded-md">
        <div className="min-w-max">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `200px repeat(${columns.length}, 16px)`,
            }}
          >
            <div className="sticky left-0 bg-background font-medium text-sm px-2 py-1 border-b">
              Row
            </div>
            {columns.map((c) => (
              <div
                key={c}
                className="text-[10px] text-center rotate-[-60deg] origin-bottom border-b h-10 flex items-end justify-center px-1"
              >
                {c}
              </div>
            ))}
            {displayRows.map((r, i) => (
              <div key={`row-group-${i}`} className="contents">
                <div className="sticky left-0 bg-background text-xs px-2 py-1 border-b">
                  {i + 1}
                </div>
                {columns.map((c, j) => {
                  const missing = r[c] == null || r[c] === "";
                  return (
                    <div
                      key={`${i}-${j}`}
                      className={
                        "w-4 h-4 border-b border-r " +
                        (missing ? "bg-destructive/70" : "bg-emerald-500/70")
                      }
                    ></div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
