import { useEffect, useMemo, useRef, useState } from "react";
import { UploadZone } from "@/components/dashboard/UploadZone";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { DataPreviewTable } from "@/components/dashboard/DataPreviewTable";
import { DataQualityHeatmap } from "@/components/dashboard/DataQualityHeatmap";
import { Histogram } from "@/components/charts/Histogram";
import { BoxPlot } from "@/components/charts/BoxPlot";
import { CorrelationHeatmap } from "@/components/charts/CorrelationHeatmap";
import { ScatterPlotMatrix } from "@/components/charts/ScatterPlotMatrix";
import { TimeSeries } from "@/components/charts/TimeSeries";
import { CategoricalBar } from "@/components/charts/CategoricalBar";
import { CategoricalPie } from "@/components/charts/CategoricalPie";
import { CrossTab, buildCrossTab } from "@/components/charts/CrossTab";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ParsedWorkbook, Row, generateSampleDataset } from "@/lib/excel";
import {
  DatasetProfile,
  correlationMatrix,
  deriveInsights,
  profileData,
} from "@/lib/dataAnalysis";
import {
  Controls,
  FiltersState,
  ChartOptions,
} from "@/components/dashboard/Controls";
import {
  exportRowsToCSV,
  exportWorkbookToXLSX,
  exportSvgToPng,
  exportReportHTML,
} from "@/lib/export";
import { toast } from "sonner";

export default function Index() {
  const [wb, setWb] = useState<ParsedWorkbook | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [corr, setCorr] = useState<{
    columns: string[];
    values: number[][];
  } | null>(null);
  const [insights, setInsights] = useState<ReturnType<
    typeof deriveInsights
  > | null>(null);
  const [filters, setFilters] = useState<FiltersState>({});
  const [options, setOptions] = useState<ChartOptions>({
    palette: "indigo",
    bins: 20,
    aggregation: "mean",
  });

  // Undo/redo stacks
  const undoStack = useRef<Row[][]>([]);
  const redoStack = useRef<Row[][]>([]);

  useEffect(() => {
    if (!wb) return;
    const s = wb.sheets[sheetIndex] || wb.sheets[0];
    if (!s) return;
    setRows(s.rows);
  }, [wb, sheetIndex]);

  useEffect(() => {
    if (!rows.length) {
      setProfile(null);
      setCorr(null);
      setInsights(null);
      return;
    }
    const p = profileData(rows);
    setProfile(p);
    if (p.numericColumns.length >= 2)
      setCorr(correlationMatrix(rows, p.numericColumns));
    setInsights(deriveInsights(p, rows));
  }, [rows]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem("insightforge-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.rows) setRows(parsed.rows);
      } catch {}
    }
  }, []);
  useEffect(() => {
    if (rows.length)
      localStorage.setItem("insightforge-state", JSON.stringify({ rows }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!profile || !rows.length) return [] as Row[];
    let r = rows;
    // date range
    if (filters.dateColumn && (filters.dateFrom || filters.dateTo)) {
      const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to = filters.dateTo ? new Date(filters.dateTo) : null;
      r = r.filter((row) => {
        const d = new Date(row[filters.dateColumn!]);
        if (isNaN(d.getTime())) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    // categories
    if (
      filters.categoryColumn &&
      filters.selectedCategories &&
      filters.selectedCategories.length
    ) {
      r = r.filter((row) =>
        filters.selectedCategories!.includes(
          String(row[filters.categoryColumn!]),
        ),
      );
    }
    return r;
  }, [rows, profile, filters]);

  const numericSeries = useMemo(() => {
    if (!profile) return {} as Record<string, number[]>;
    const res: Record<string, number[]> = {};
    for (const c of profile.numericColumns) {
      res[c] = filteredRows
        .map((r) => toNumber(r[c]))
        .filter((v) => isFinite(v));
    }
    return res;
  }, [filteredRows, profile]);

  function toNumber(v: any) {
    if (typeof v === "number") return v;
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isFinite(n) ? n : NaN;
  }

  const sheetSelector = wb ? (
    <div className="flex flex-wrap gap-2">
      {wb.sheets.map((s, i) => (
        <Button
          key={s.name}
          variant={i === sheetIndex ? "default" : "outline"}
          size="sm"
          onClick={() => setSheetIndex(i)}
        >
          {s.name}
        </Button>
      ))}
    </div>
  ) : null;

  function pushState() {
    undoStack.current.push(rows);
    redoStack.current = [];
  }
  function undo() {
    const prev = undoStack.current.pop();
    if (prev) {
      redoStack.current.push(rows);
      setRows(prev);
    }
  }
  function redo() {
    const next = redoStack.current.pop();
    if (next) {
      undoStack.current.push(rows);
      setRows(next);
    }
  }

  function handleParsed(wb: ParsedWorkbook) {
    setWb(wb);
    setSheetIndex(0);
    toast.message("Workbook loaded", {
      description: `${wb.metadata.sheetNames.join(", ")}`,
    });
  }

  const autoRecommendations = useMemo(() => {
    if (!profile) return [] as string[];
    const rec: string[] = [];
    if (profile.numericColumns.length)
      rec.push("Histograms and box plots for numeric distributions");
    if (profile.numericColumns.length >= 2)
      rec.push(
        "Correlation heatmap and scatter plot matrix to explore relationships",
      );
    if (profile.datetimeColumns.length)
      rec.push("Time series trends for temporal patterns");
    if (profile.categoricalColumns.length)
      rec.push("Bar and pie charts for categorical proportions");
    return rec;
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            InsightForge Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload Excel workbooks to automatically analyze, visualize, and
            extract insights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const sample = generateSampleDataset("sales");
              handleParsed(sample);
              setRows(sample.sheets[0].rows);
              toast.success("Loaded sample data");
            }}
          >
            Load sample data
          </Button>
          {rows.length ? (
            <>
              <Button
                variant="ghost"
                onClick={undo}
                disabled={!undoStack.current.length}
              >
                Undo
              </Button>
              <Button
                variant="ghost"
                onClick={redo}
                disabled={!redoStack.current.length}
              >
                Redo
              </Button>
              <Button
                variant="outline"
                onClick={() => exportRowsToCSV(filteredRows)}
              >
                Export CSV
              </Button>
              {wb && (
                <Button onClick={() => exportWorkbookToXLSX(wb)}>
                  Export Excel
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <UploadZone onParsed={handleParsed} />

      {wb && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-medium">
              Workbook: {wb.metadata.fileName} •{" "}
              {wb.metadata.totalRows.toLocaleString()} rows •{" "}
              {wb.metadata.totalColumns} columns
            </div>
            {sheetSelector}
          </div>
        </div>
      )}

      {profile && (
        <>
          <SummaryCards profile={profile} />

          <Controls
            profile={profile}
            rows={rows}
            onChangeFilters={setFilters}
            onChangeOptions={setOptions}
          />

          <Accordion
            type="multiple"
            defaultValue={["overview", "numeric", "categorical", "advanced"]}
          >
            <AccordionItem value="overview">
              <AccordionTrigger>Overview</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  <DataPreviewTable rows={filteredRows} />
                  <DataQualityHeatmap rows={filteredRows} />
                </div>
                <div className="mt-4 rounded-md border p-4">
                  <div className="font-medium mb-2">Insights</div>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    {insights &&
                      insights.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    {autoRecommendations.map((r, i) => (
                      <li key={`auto-${i}`}>{r}</li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="numeric">
              <AccordionTrigger>Numerical Analysis</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  {profile.numericColumns.slice(0, 2).map((c) => (
                    <div key={c} className="rounded-md border p-4">
                      <div className="font-medium mb-2">{c} • Histogram</div>
                      <Histogram
                        data={numericSeries[c] || []}
                        bins={options.bins}
                      />
                      <div className="font-medium mt-4 mb-2">
                        {c} • Box Plot
                      </div>
                      <BoxPlot data={numericSeries[c] || []} />
                    </div>
                  ))}
                </div>
                {corr && (
                  <div className="mt-6 rounded-md border p-4">
                    <div className="font-medium mb-2">Correlation Matrix</div>
                    <CorrelationHeatmap matrix={corr} />
                  </div>
                )}
                {profile.numericColumns.length >= 2 && (
                  <div className="mt-6 rounded-md border p-4">
                    <div className="font-medium mb-2">Scatter Plot Matrix</div>
                    <ScatterPlotMatrix
                      rows={filteredRows}
                      columns={profile.numericColumns}
                    />
                  </div>
                )}
                {profile.datetimeColumns.length ? (
                  <div className="mt-6 rounded-md border p-4">
                    <div className="font-medium mb-2">Time Series Trends</div>
                    <TimeSeries
                      rows={filteredRows}
                      dateColumn={profile.datetimeColumns[0]}
                      numericColumns={profile.numericColumns}
                    />
                  </div>
                ) : null}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="categorical">
              <AccordionTrigger>Categorical Analysis</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  {profile.categoricalColumns.slice(0, 2).map((c) => {
                    const counts: Record<string, number> = {};
                    for (const r of filteredRows) {
                      const v = r[c];
                      if (v == null || v === "") continue;
                      counts[String(v)] = (counts[String(v)] || 0) + 1;
                    }
                    return (
                      <div key={c} className="rounded-md border p-4">
                        <div className="font-medium mb-2">
                          {c} • Value Counts
                        </div>
                        <CategoricalBar values={counts} />
                        <div className="font-medium mt-4 mb-2">
                          {c} • Proportion
                        </div>
                        <CategoricalPie values={counts} />
                      </div>
                    );
                  })}
                </div>
                {profile.categoricalColumns.length >= 2 && (
                  <div className="mt-6 rounded-md border p-4">
                    <div className="font-medium mb-2">Cross Tabulation</div>
                    {(() => {
                      const a = profile.categoricalColumns[0];
                      const b = profile.categoricalColumns[1];
                      const data = filteredRows.map((r) => ({
                        a: String(r[a]),
                        b: String(r[b]),
                      }));
                      const {
                        matrix,
                        rows: rr,
                        cols: cc,
                      } = buildCrossTab(data);
                      return <CrossTab matrix={matrix} rows={rr} cols={cc} />;
                    })()}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-muted-foreground mb-3">
                  Export charts as PNG: click the download icon on each chart
                  section, or export a full HTML report.
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportReportHTML(renderReportHtml(profile!, insights))
                  }
                >
                  Export Report (HTML)
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}
    </div>
  );
}

function renderReportHtml(
  profile: DatasetProfile,
  insights: ReturnType<typeof deriveInsights> | null,
) {
  return `
  <h1>Analysis Report</h1>
  <p class="muted">Rows: ${profile.rowCount.toLocaleString()} • Columns: ${profile.columnCount} • Completeness: ${Math.round(profile.completeness * 100)}%</p>
  <h2>Columns</h2>
  <ul>
    ${profile.columns.map((c) => `<li><strong>${c.name}</strong> — ${c.type}${c.stats ? ` (μ=${c.stats.mean.toFixed(2)}, σ=${c.stats.std.toFixed(2)})` : ""}</li>`).join("")}
  </ul>
  <h2>Insights</h2>
  <ul>
    ${insights ? insights.recommendations.map((r) => `<li>${r}</li>`).join("") : "<li>No insights</li>"}
  </ul>
  `;
}
