import { useMemo, useState } from "react";
import { Row } from "@/lib/excel";
import { Input } from "@/components/ui/input";

export function DataPreviewTable({ rows, maxRows = 200 }: { rows: Row[]; maxRows?: number }) {
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = rows;
    if (q) {
      r = r.filter((row) => columns.some((c) => String(row[c] ?? "").toLowerCase().includes(q)));
    }
    if (sortCol) {
      r = [...r].sort((a, b) => {
        const va = a[sortCol!];
        const vb = b[sortCol!];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === "number" && typeof vb === "number") return sortDir === "asc" ? va - vb : vb - va;
        return sortDir === "asc"
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      });
    }
    return r.slice(0, maxRows);
  }, [rows, query, sortCol, sortDir, maxRows, columns]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-2 flex items-center justify-between gap-2 bg-muted/50">
        <div className="text-sm text-muted-foreground">Previewing {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} rows</div>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter rows..." className="h-8 w-48" />
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  onClick={() => {
                    if (sortCol === c) setSortDir(sortDir === "asc" ? "desc" : "asc");
                    else { setSortCol(c); setSortDir("asc"); }
                  }}
                  className="text-left font-semibold px-3 py-2 border-b cursor-pointer select-none whitespace-nowrap"
                >
                  {c}
                  {sortCol === c ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-muted/30" : ""}>
                {columns.map((c) => (
                  <td key={c} className="px-3 py-2 border-b whitespace-nowrap max-w-[280px] overflow-hidden text-ellipsis" title={String(r[c])}>
                    {String(r[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
