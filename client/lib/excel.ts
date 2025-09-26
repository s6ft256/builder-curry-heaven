import * as XLSX from "xlsx";

export type Row = Record<string, any>;
export interface ParsedWorkbook {
  sheets: { name: string; rows: Row[] }[];
  metadata: {
    sheetNames: string[];
    totalRows: number;
    totalColumns: number;
    fileName: string;
    fileSize: number;
  };
}

export interface FileValidationResult {
  ok: boolean;
  errors: string[];
}

const ALLOWED_EXT = [".xlsx", ".xls"];
const MAX_BYTES = 25 * 1024 * 1024; // 25MB

export function validateExcelFile(file: File): FileValidationResult {
  const errors: string[] = [];
  const name = file.name.toLowerCase();
  if (!ALLOWED_EXT.some((ext) => name.endsWith(ext))) {
    errors.push("Unsupported file type. Please upload .xlsx or .xls");
  }
  if (file.size > MAX_BYTES) {
    errors.push(
      `File is too large. Max size is ${Math.round(MAX_BYTES / (1024 * 1024))}MB`,
    );
  }
  if (!file.type || !file.type.includes("sheet")) {
    // Browsers sometimes omit a proper mime-type; don't hard fail, just warn
  }
  return { ok: errors.length === 0, errors };
}

export async function parseExcel(file: File): Promise<ParsedWorkbook> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  const sheetNames = wb.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error("The workbook contains no sheets.");
  }
  const sheets = sheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const rows: Row[] = XLSX.utils.sheet_to_json(ws, {
      defval: null,
      raw: true,
    });
    return { name, rows };
  });
  const totalRows = sheets.reduce((acc, s) => acc + s.rows.length, 0);
  const totalColumns = Math.max(
    0,
    ...sheets.map((s) => (s.rows[0] ? Object.keys(s.rows[0]).length : 0)),
  );
  return {
    sheets,
    metadata: {
      sheetNames,
      totalRows,
      totalColumns,
      fileName: file.name,
      fileSize: file.size,
    },
  };
}

// Sample datasets for demo/testing
export function generateSampleDataset(
  kind: "sales" | "finance" | "survey" | "ops" = "sales",
): ParsedWorkbook {
  const now = new Date();
  const days = 120;
  const rows: Row[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() - (days - i) * 24 * 60 * 60 * 1000);
    const region = ["North", "South", "East", "West"][
      Math.floor(Math.random() * 4)
    ];
    const product = ["A", "B", "C", "D"][Math.floor(Math.random() * 4)];
    const units = Math.floor(Math.random() * 90) + 10;
    const price = [29, 49, 79, 99][Math.floor(Math.random() * 4)];
    const revenue = units * price * (0.8 + Math.random() * 0.4);
    const expense = revenue * (0.4 + Math.random() * 0.2);
    const kpi = Math.random() * 100;
    const rating = Math.ceil(Math.random() * 5);
    return {
      Date: d.toISOString().slice(0, 10),
      Region: region,
      Product: product,
      Units: units,
      Price: price,
      Revenue: Math.round(revenue * 100) / 100,
      Expense: Math.round(expense * 100) / 100,
      KPI: Math.round(kpi * 100) / 100,
      Rating: rating,
    };
  });

  return {
    sheets: [{ name: "Sheet1", rows }],
    metadata: {
      sheetNames: ["Sheet1"],
      totalRows: rows.length,
      totalColumns: Object.keys(rows[0]).length,
      fileName: `sample-${kind}.xlsx`,
      fileSize: rows.length * 100, // dummy
    },
  };
}
