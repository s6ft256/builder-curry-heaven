import * as XLSX from "xlsx";
import { ParsedWorkbook, Row } from "./excel";

export function exportRowsToCSV(rows: Row[], filename = "data.csv") {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")]
    .concat(
      rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(","))
    )
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

function escapeCsv(v: any) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes("\n") || s.includes("\"")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function exportWorkbookToXLSX(wb: ParsedWorkbook, filename = "analysis.xlsx") {
  const book = XLSX.utils.book_new();
  for (const sheet of wb.sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(book, ws, sheet.name.slice(0, 31));
  }
  XLSX.writeFile(book, filename);
}

export async function exportSvgToPng(el: HTMLElement, filename = "chart.png", width?: number, height?: number) {
  const svg = el.querySelector("svg");
  if (!svg) throw new Error("No SVG element found to export");
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  const w = width || svg.clientWidth || 800;
  const h = height || svg.clientHeight || 400;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--background");
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename);
    URL.revokeObjectURL(url);
  });
}

export function exportReportHTML(content: string, filename = "report.html") {
  const doc = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><title>Analysis Report</title>
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>
  <style>body{font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial,Noto Sans,sans-serif;color:#111827;padding:24px;max-width:960px;margin:0 auto} h1,h2{color:#111827} .muted{color:#6b7280}</style>
  </head><body>${content}</body></html>`;
  downloadBlob(new Blob([doc], { type: "text/html;charset=utf-8;" }), filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
