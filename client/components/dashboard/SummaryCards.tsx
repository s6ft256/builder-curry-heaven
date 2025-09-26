import { Card, CardContent } from "@/components/ui/card";
import { DatasetProfile } from "@/lib/dataAnalysis";

export function SummaryCards({ profile }: { profile: DatasetProfile }) {
  const items = [
    { label: "Rows", value: profile.rowCount.toLocaleString() },
    { label: "Columns", value: profile.columnCount.toLocaleString() },
    {
      label: "Completeness",
      value: `${Math.round(profile.completeness * 100)}%`,
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg border bg-card">
          <div className="p-4">
            <div className="text-sm text-muted-foreground">{it.label}</div>
            <div className="text-2xl font-bold mt-1">{it.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
