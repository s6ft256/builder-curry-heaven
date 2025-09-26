import { useEffect, useMemo, useState } from "react";
import { DatasetProfile } from "@/lib/dataAnalysis";
import { Row } from "@/lib/excel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface FiltersState {
  dateColumn?: string;
  dateFrom?: string; // ISO yyyy-mm-dd
  dateTo?: string;
  categoryColumn?: string;
  selectedCategories?: string[];
}

export interface ChartOptions {
  palette: "indigo" | "teal" | "rainbow";
  bins: number;
  aggregation: "mean" | "sum" | "count";
}

export function Controls({
  profile,
  rows,
  onChangeFilters,
  onChangeOptions,
}: {
  profile: DatasetProfile;
  rows: Row[];
  onChangeFilters: (f: FiltersState) => void;
  onChangeOptions: (o: ChartOptions) => void;
}) {
  const [filters, setFilters] = useState<FiltersState>({
    dateColumn: profile.datetimeColumns[0],
  });
  const [options, setOptions] = useState<ChartOptions>({
    palette: "indigo",
    bins: 20,
    aggregation: "mean",
  });
  const categories = useMemo(() => {
    const c = filters.categoryColumn;
    if (!c) return [] as string[];
    const set = new Set<string>();
    for (const r of rows) {
      const v = r[c];
      if (v != null && v !== "") set.add(String(v));
      if (set.size > 200) break;
    }
    return Array.from(set);
  }, [filters.categoryColumn, rows]);

  useEffect(() => onChangeFilters(filters), [filters]);
  useEffect(() => onChangeOptions(options), [options]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border p-4">
        <div className="font-medium mb-2">Filters</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Date column</label>
            <select
              className="w-full h-9 border rounded px-2"
              value={filters.dateColumn || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  dateColumn: e.target.value || undefined,
                }))
              }
            >
              <option value="">None</option>
              {profile.datetimeColumns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateFrom: e.target.value }))
                }
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateTo: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Category column
            </label>
            <select
              className="w-full h-9 border rounded px-2"
              value={filters.categoryColumn || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  categoryColumn: e.target.value || undefined,
                  selectedCategories: [],
                }))
              }
            >
              <option value="">None</option>
              {profile.categoricalColumns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Selected categories
            </label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-auto border rounded p-2">
              {categories.map((v) => (
                <label
                  key={v}
                  className="text-xs inline-flex items-center gap-1"
                >
                  <input
                    type="checkbox"
                    checked={filters.selectedCategories?.includes(v) || false}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        selectedCategories: e.target.checked
                          ? [...(f.selectedCategories || []), v]
                          : (f.selectedCategories || []).filter((x) => x !== v),
                      }))
                    }
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="font-medium mb-2">Chart options</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs text-muted-foreground">Palette</label>
            <select
              className="w-full h-9 border rounded px-2"
              value={options.palette}
              onChange={(e) =>
                setOptions((o) => ({ ...o, palette: e.target.value as any }))
              }
            >
              <option value="indigo">Indigo</option>
              <option value="teal">Teal</option>
              <option value="rainbow">Rainbow</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Histogram bins
            </label>
            <Input
              type="number"
              min={5}
              max={100}
              value={options.bins}
              onChange={(e) =>
                setOptions((o) => ({ ...o, bins: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Aggregation</label>
            <select
              className="w-full h-9 border rounded px-2"
              value={options.aggregation}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  aggregation: e.target.value as any,
                }))
              }
            >
              <option value="mean">Mean</option>
              <option value="sum">Sum</option>
              <option value="count">Count</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
