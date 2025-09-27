import type { Row } from "./excel";
import type { DatasetProfile } from "./dataAnalysis";

function toNumber(v: any): number | null {
  if (typeof v === "number" && isFinite(v)) return v;
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isFinite(n) ? n : null;
}

function quantiles(arr: number[]) {
  const a = [...arr].sort((x, y) => x - y);
  const q = (p: number) => {
    if (a.length === 0) return 0;
    const pos = (a.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    return a[base] + (a[base + 1] - a[base]) * rest || a[base];
  };
  return { q1: q(0.25), q2: q(0.5), q3: q(0.75) };
}

function winsorize(arr: number[]) {
  if (arr.length < 5) return arr;
  const { q1, q3 } = quantiles(arr);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return arr.map((v) => (v < lo ? lo : v > hi ? hi : v));
}

function mode<T>(arr: T[]): T | null {
  if (!arr.length) return null as any;
  const map = new Map<T, number>();
  for (const v of arr) map.set(v, (map.get(v) || 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function normalizeBoolean(v: any): boolean | null {
  if (typeof v === "boolean") return v;
  if (v == null || v === "") return null;
  const s = String(v).trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(s)) return true;
  if (["false", "no", "n", "0"].includes(s)) return false;
  return null;
}

function normalizeDate(v: any): string | null {
  if (v == null || v === "") return null;
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return null;
  // Prefer YYYY-MM-DD if time 00:00:00, else ISO string
  const iso = d.toISOString();
  return iso.slice(11, 19) === "00:00:00" ? iso.slice(0, 10) : iso;
}

export function cleanData(rows: Row[], profile: DatasetProfile): { rows: Row[]; report: string[] } {
  const report: string[] = [];
  const out: Row[] = rows.map((r) => ({ ...r }));

  // Precompute modes/medians
  const medians = new Map<string, number>();
  const modes = new Map<string, any>();

  for (const col of profile.columns) {
    const name = col.name;
    if (col.type === "numeric") {
      const nums = rows
        .map((rr) => toNumber(rr[name]))
        .filter((v): v is number => v !== null);
      if (nums.length) {
        const { q2 } = quantiles(nums);
        medians.set(name, q2);
      }
    } else if (col.type === "boolean") {
      const vals = rows
        .map((rr) => normalizeBoolean(rr[name]))
        .filter((v): v is boolean => v !== null);
      const m = mode(vals);
      if (m !== null) modes.set(name, m);
    } else if (col.type === "categorical" || col.type === "text") {
      const vals = rows
        .map((rr) => (rr[name] == null || rr[name] === "" ? null : String(rr[name]).trim()))
        .filter((v): v is string => v !== null && v !== "");
      const m = mode(vals);
      if (m != null) modes.set(name, m);
    }
  }

  for (const col of profile.columns) {
    const name = col.name;
    if (col.type === "numeric") {
      // Convert and impute median, winsorize
      const nums = out.map((rr) => toNumber(rr[name]));
      const median = medians.get(name) ?? 0;
      const converted = nums.map((v) => (v == null ? median : v));
      const clipped = winsorize(converted);
      for (let i = 0; i < out.length; i++) out[i][name] = clipped[i];
      report.push(`${name}: converted to number, imputed median ${median.toFixed(2)}, winsorized outliers`);
    } else if (col.type === "datetime") {
      for (const rr of out) rr[name] = normalizeDate(rr[name]) ?? rr[name];
      report.push(`${name}: normalized dates to ISO (YYYY-MM-DD or ISO 8601)`);
    } else if (col.type === "boolean") {
      const m = modes.get(name);
      for (const rr of out) {
        const v = normalizeBoolean(rr[name]);
        rr[name] = v == null ? (m ?? false) : v;
      }
      report.push(`${name}: normalized booleans and filled missing with mode`);
    } else if (col.type === "categorical" || col.type === "text") {
      const m = modes.get(name) ?? "Unknown";
      for (const rr of out) {
        const v = rr[name];
        rr[name] = v == null || v === "" ? m : String(v).trim();
      }
      report.push(`${name}: trimmed text and filled missing with '${m}'`);
    }
  }

  return { rows: out, report };
}
