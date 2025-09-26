import type { Row } from "./excel";

export type ColumnType = "numeric" | "categorical" | "datetime" | "boolean" | "text";

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  nonNullCount: number;
  nullCount: number;
  uniqueCount: number;
  sampleValues: any[];
  stats?: {
    count: number;
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
    iqr: number;
    skewness: number;
  };
  topCategories?: { value: string; count: number }[];
  dateCoverage?: {
    start: Date;
    end: Date;
    days: number;
  };
}

export interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  completeness: number; // 0..1
  columns: ColumnProfile[];
  numericColumns: string[];
  categoricalColumns: string[];
  datetimeColumns: string[];
  booleanColumns: string[];
}

export interface CorrelationMatrix {
  columns: string[];
  values: number[][]; // pearson r
}

export interface TemporalTrend {
  dateColumn: string;
  series: { date: Date; values: Record<string, number> }[]; // per numeric column
}

export interface Insights {
  strongCorrelations: { a: string; b: string; r: number }[];
  highMissingColumns: { name: string; missingRate: number }[];
  outlierColumns: { name: string; outlierRate: number }[];
  categoryImbalance: { name: string; top: string; share: number }[];
  seasonalityCandidates: { column: string; lag: number; acf: number }[];
  recommendations: string[];
}

export function inferType(value: any): ColumnType | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && isFinite(value)) return "numeric";
  if (typeof value === "boolean") return "boolean";
  // Date detection: ISO string or Date instance
  if (value instanceof Date) return "datetime";
  if (typeof value === "string") {
    const s = value.trim();
    if (s === "true" || s === "false") return "boolean";
    // number-like
    if (/^[-+]?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s) || /^[-+]?\d*(\.\d+)?$/.test(s))
      return "numeric";
    // date-like
    const d = new Date(s);
    if (!isNaN(d.getTime())) return "datetime";
    return "text";
  }
  return "text";
}

export function inferColumnType(values: any[]): ColumnType {
  const sample = values.filter((v) => v !== null && v !== "" && v !== undefined).slice(0, 200);
  const counts: Record<ColumnType, number> = {
    numeric: 0,
    categorical: 0,
    datetime: 0,
    boolean: 0,
    text: 0,
  };
  for (const v of sample) {
    const t = inferType(v);
    if (!t) continue;
    counts[t]++;
  }
  // Decide between categorical/text by unique ratio
  const unique = new Set(sample.map((v) => String(v))).size;
  const uniqueRatio = sample.length ? unique / sample.length : 0;
  const maxType = (Object.keys(counts) as ColumnType[]).reduce((a, b) => (counts[a] >= counts[b] ? a : b));
  if (maxType === "text" && uniqueRatio < 0.2) return "categorical";
  if (maxType === "numeric" && uniqueRatio < 0.05) return "categorical";
  return maxType;
}

function quantiles(arr: number[]): { q1: number; q2: number; q3: number } {
  const a = [...arr].sort((x, y) => x - y);
  const q = (p: number) => {
    const pos = (a.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    return a[base] + (a[base + 1] - a[base]) * rest || a[base];
  };
  return { q1: q(0.25), q2: q(0.5), q3: q(0.75) };
}

function meanStd(arr: number[]) {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / (n || 1);
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / (n > 1 ? n - 1 : 1);
  const std = Math.sqrt(variance);
  return { mean, std };
}

function skewness(arr: number[]) {
  const n = arr.length;
  if (n < 3) return 0;
  const { mean, std } = meanStd(arr);
  const m3 = arr.reduce((a, x) => a + (x - mean) ** 3, 0) / n;
  return m3 / ((std || 1) ** 3);
}

export function profileData(rows: Row[]): DatasetProfile {
  const rowCount = rows.length;
  const columnNames = rows[0] ? Object.keys(rows[0]) : [];

  const columns: ColumnProfile[] = columnNames.map((name) => {
    const colValues = rows.map((r) => r[name]);
    const nonNull = colValues.filter((v) => v !== null && v !== undefined && v !== "");
    const type = inferColumnType(colValues);

    const base: ColumnProfile = {
      name,
      type,
      nonNullCount: nonNull.length,
      nullCount: rowCount - nonNull.length,
      uniqueCount: new Set(nonNull.map((v) => String(v))).size,
      sampleValues: nonNull.slice(0, 5),
    };

    if (type === "numeric") {
      const nums = nonNull.map((v) => (typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, "")))).filter((v) => isFinite(v));
      const { q1, q2, q3 } = quantiles(nums);
      const { mean, std } = meanStd(nums);
      const stats = {
        count: nums.length,
        mean,
        median: q2,
        std,
        min: Math.min(...nums),
        max: Math.max(...nums),
        q1,
        q3,
        iqr: q3 - q1,
        skewness: skewness(nums),
      };
      base.stats = stats;
    }

    if (type === "categorical" || type === "text" || type === "boolean") {
      const map = new Map<string, number>();
      for (const v of nonNull) {
        const key = String(v);
        map.set(key, (map.get(key) || 0) + 1);
      }
      const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      base.topCategories = sorted.map(([value, count]) => ({ value, count }));
    }

    if (type === "datetime") {
      const dates = nonNull.map((v) => (v instanceof Date ? v : new Date(v))).filter((d) => !isNaN(d.getTime()));
      const start = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date(0);
      const end = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date(0);
      base.dateCoverage = { start, end, days: Math.max(0, Math.round((+end - +start) / 86400000)) };
    }

    return base;
  });

  const missingTotal = columns.reduce((acc, c) => acc + c.nullCount, 0);
  const totalCells = (rowCount || 0) * (columns.length || 0);
  const completeness = totalCells ? 1 - missingTotal / totalCells : 1;

  return {
    rowCount,
    columnCount: columns.length,
    completeness,
    columns,
    numericColumns: columns.filter((c) => c.type === "numeric").map((c) => c.name),
    categoricalColumns: columns.filter((c) => c.type === "categorical").map((c) => c.name),
    datetimeColumns: columns.filter((c) => c.type === "datetime").map((c) => c.name),
    booleanColumns: columns.filter((c) => c.type === "boolean").map((c) => c.name),
  };
}

export function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = x[i] - mx;
    const vy = y[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const den = Math.sqrt(dx * dy) || 1;
  return Math.max(-1, Math.min(1, num / den));
}

export function correlationMatrix(rows: Row[], numericColumns: string[]): CorrelationMatrix {
  const cols = numericColumns;
  const series = cols.map((c) => rows.map((r) => toNumber(r[c])).filter((v) => isFinite(v)));
  const values: number[][] = cols.map(() => Array(cols.length).fill(0));
  for (let i = 0; i < cols.length; i++) {
    for (let j = 0; j < cols.length; j++) {
      values[i][j] = pearson(series[i], series[j]);
    }
  }
  return { columns: cols, values };
}

function toNumber(v: any): number {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isFinite(n) ? n : NaN;
}

export function detectOutliers(rows: Row[], numericColumns: string[]): { name: string; outlierRate: number }[] {
  const res: { name: string; outlierRate: number }[] = [];
  for (const c of numericColumns) {
    const nums = rows.map((r) => toNumber(r[c])).filter((v) => isFinite(v));
    if (nums.length < 5) continue;
    const { q1, q3 } = quantiles(nums);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    const outliers = nums.filter((v) => v < lower || v > upper).length;
    res.push({ name: c, outlierRate: outliers / nums.length });
  }
  return res;
}

export function temporalTrends(rows: Row[], dateColumn: string, numericColumns: string[]): TemporalTrend {
  // Aggregate by day
  const map = new Map<string, Record<string, number[]>>();
  for (const r of rows) {
    const d = new Date(r[dateColumn]);
    if (isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, {});
    const entry = map.get(key)!;
    for (const c of numericColumns) {
      const v = toNumber(r[c]);
      if (!isFinite(v)) continue;
      (entry[c] ||= []).push(v);
    }
  }
  const keys = [...map.keys()].sort();
  const series = keys.map((k) => {
    const vals = map.get(k)!;
    const agg: Record<string, number> = {};
    for (const c of numericColumns) {
      const arr = vals[c] || [];
      agg[c] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }
    return { date: new Date(k), values: agg };
  });
  return { dateColumn, series };
}

function autocorr(x: number[], lag: number): number {
  if (lag <= 0 || lag >= x.length) return 0;
  const x1 = x.slice(0, x.length - lag);
  const x2 = x.slice(lag);
  return pearson(x1, x2);
}

export function deriveInsights(profile: DatasetProfile, rows: Row[]): Insights {
  const strongCorrelations: { a: string; b: string; r: number }[] = [];
  if (profile.numericColumns.length >= 2) {
    const corr = correlationMatrix(rows, profile.numericColumns);
    for (let i = 0; i < corr.columns.length; i++) {
      for (let j = i + 1; j < corr.columns.length; j++) {
        const r = corr.values[i][j];
        if (Math.abs(r) >= 0.7) strongCorrelations.push({ a: corr.columns[i], b: corr.columns[j], r });
      }
    }
  }

  const highMissingColumns = profile.columns
    .filter((c) => c.nullCount / (profile.rowCount || 1) > 0.2)
    .map((c) => ({ name: c.name, missingRate: c.nullCount / (profile.rowCount || 1) }))
    .sort((a, b) => b.missingRate - a.missingRate);

  const outlierColumns = detectOutliers(rows, profile.numericColumns).filter((o) => o.outlierRate > 0.05);

  const categoryImbalance = profile.columns
    .filter((c) => c.type === "categorical" && c.topCategories && c.topCategories.length)
    .map((c) => {
      const top = c.topCategories![0];
      const share = top.count / (c.nonNullCount || 1);
      return { name: c.name, top: top.value, share };
    })
    .filter((x) => x.share > 0.6);

  const seasonalityCandidates: { column: string; lag: number; acf: number }[] = [];
  const dateCol = profile.datetimeColumns[0];
  if (dateCol && profile.numericColumns.length) {
    const t = temporalTrends(rows, dateCol, profile.numericColumns);
    for (const c of profile.numericColumns) {
      const series = t.series.map((s) => s.values[c]);
      // Check weekly (7) and monthly (30) patterns
      for (const lag of [7, 12, 30]) {
        const acf = autocorr(series, Math.min(lag, Math.floor(series.length / 2)));
        if (acf > 0.5) seasonalityCandidates.push({ column: c, lag, acf });
      }
    }
  }

  const recommendations: string[] = [];
  if (highMissingColumns.length) recommendations.push("Consider imputing missing values (mean/median/mode) or dropping columns with high missingness.");
  if (outlierColumns.length) recommendations.push("Winsorize or apply robust scaling to columns with many outliers.");
  if (categoryImbalance.length) recommendations.push("Encode categorical variables and consider techniques to handle class imbalance.");
  if (profile.numericColumns.length > 5) recommendations.push("Normalize or standardize numeric features to improve comparability.");
  if (strongCorrelations.length) recommendations.push("High correlations detected; consider removing multicollinearity for modeling.");

  return { strongCorrelations, highMissingColumns, outlierColumns, categoryImbalance, seasonalityCandidates, recommendations };
}

export function completenessScore(profile: DatasetProfile): number {
  return profile.completeness;
}

export function filterRows(rows: Row[], filters: { [key: string]: any }): Row[] {
  return rows.filter((r) => {
    for (const [key, value] of Object.entries(filters)) {
      const v = r[key];
      if (value == null) continue;
      if (Array.isArray(value) && value.length === 2 && value[0] instanceof Date && value[1] instanceof Date) {
        const d = new Date(v);
        if (isNaN(d.getTime())) return false;
        if (d < value[0] || d > value[1]) return false;
      } else if (Array.isArray(value)) {
        if (!value.includes(v)) return false;
      } else if (typeof value === "function") {
        if (!value(v)) return false;
      } else if (v !== value) {
        return false;
      }
    }
    return true;
  });
}
