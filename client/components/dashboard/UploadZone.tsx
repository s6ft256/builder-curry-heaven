import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { validateExcelFile, parseExcel, ParsedWorkbook } from "@/lib/excel";
import { toast } from "sonner";

export function UploadZone({
  onParsed,
}: {
  onParsed: (wb: ParsedWorkbook) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const validation = validateExcelFile(file);
      if (!validation.ok) {
        validation.errors.forEach((e) => toast.error(e));
        return;
      }
      try {
        setProgress(10);
        const wb = await parseExcelWithProgress(file, setProgress);
        toast.success("File processed successfully");
        onParsed(wb);
      } catch (e: any) {
        toast.error(e?.message || "Failed to parse file");
      } finally {
        setProgress(null);
      }
    },
    [onParsed],
  );

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    await handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors " +
        (isDragging ? "border-primary bg-primary/5" : "border-border")
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.ms-excel.sheet.macroEnabled.12"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center gap-2">
        <p className="font-medium">Drag & drop Excel files here</p>
        <p className="text-sm text-muted-foreground">
          .xlsx, .xls, .xlsm up to 25MB. Multiple sheets supported.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Button onClick={() => inputRef.current?.click()}>Choose file</Button>
          {progress !== null && (
            <div className="text-sm text-muted-foreground">
              Processing {progress}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function parseExcelWithProgress(
  file: File,
  onProgress: (p: number) => void,
) {
  // We can't truly stream parse with xlsx here; emulate stages
  onProgress(25);
  const wb = await parseExcel(file);
  onProgress(75);
  // little delay for UX polish
  await new Promise((r) => setTimeout(r, 150));
  onProgress(100);
  return wb;
}
