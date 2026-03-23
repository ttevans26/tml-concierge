import { useState, useRef } from "react";
import { Upload, X, Check, FileSpreadsheet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CsvRow {
  day: number;
  date: string;
  type: "logistics" | "stay" | "agenda" | "dining";
  title: string;
  subtitle: string;
  time?: string;
  confirmation?: string;
}

interface CsvImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: CsvRow[]) => void;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || "";
    });

    const type = (obj.type || "agenda").toLowerCase() as CsvRow["type"];
    if (!["logistics", "stay", "agenda", "dining"].includes(type)) continue;

    rows.push({
      day: parseInt(obj.day || "1", 10),
      date: obj.date || "",
      type,
      title: obj.title || "Untitled",
      subtitle: obj.subtitle || "",
      time: obj.time || undefined,
      confirmation: obj.confirmation || undefined,
    });
  }

  return rows;
}

export default function CsvImporter({ open, onOpenChange, onImport }: CsvImporterProps) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    onImport(rows);
    setRows([]);
    setFileName("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setRows([]);
    setFileName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-medium flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-forest" strokeWidth={1.5} />
            Bulk CSV Import
          </DialogTitle>
          <DialogDescription className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            Upload a CSV to populate the grid
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-sm py-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-forest/40 transition-colors"
          >
            <Upload className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-xs font-body text-muted-foreground">
              {fileName || "Click to select CSV file"}
            </span>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>

          <div className="text-[10px] font-body text-muted-foreground space-y-1">
            <p className="font-medium uppercase tracking-widest">Expected columns:</p>
            <p className="font-mono text-foreground/70">day, date, type, title, subtitle, time, confirmation</p>
            <p>Types: logistics, stay, agenda, dining</p>
          </div>

          {rows.length > 0 && (
            <>
              <div className="border border-border rounded-sm max-h-48 overflow-y-auto">
                <table className="w-full text-[10px] font-body">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-2 py-1.5 text-left font-medium uppercase tracking-widest text-muted-foreground">Day</th>
                      <th className="px-2 py-1.5 text-left font-medium uppercase tracking-widest text-muted-foreground">Type</th>
                      <th className="px-2 py-1.5 text-left font-medium uppercase tracking-widest text-muted-foreground">Title</th>
                      <th className="px-2 py-1.5 text-left font-medium uppercase tracking-widest text-muted-foreground">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-2 py-1">{row.day}</td>
                        <td className="px-2 py-1 capitalize">{row.type}</td>
                        <td className="px-2 py-1 text-foreground font-medium">{row.title}</td>
                        <td className="px-2 py-1">{row.time || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <p className="text-center py-1 text-[10px] text-muted-foreground">
                    …and {rows.length - 20} more rows
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-muted-foreground">
                  <Check className="w-3 h-3 text-forest inline mr-1" strokeWidth={2} />
                  {rows.length} entries parsed
                </span>
                <Button
                  onClick={handleConfirm}
                  className="bg-foreground text-background hover:bg-foreground/90 font-body text-xs tracking-wider uppercase h-9 px-6"
                >
                  Import All
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
