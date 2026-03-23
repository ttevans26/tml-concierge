import { useState } from "react";
import { Plane, TrainFront, Bus, Car, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type TransportType = "plane" | "train" | "bus" | "private";

export interface LogisticsEntry {
  transportType: TransportType;
  transportNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureLocation: string;
  arrivalLocation: string;
}

interface LogisticsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayLabel: string;
  dateLabel: string;
  onAdd: (entry: LogisticsEntry) => void;
}

const TRANSPORT_OPTIONS: { type: TransportType; label: string; icon: typeof Plane; numberLabel: string }[] = [
  { type: "plane", label: "Flight", icon: Plane, numberLabel: "Flight Number" },
  { type: "train", label: "Train", icon: TrainFront, numberLabel: "Train Number" },
  { type: "bus", label: "Bus", icon: Bus, numberLabel: "Bus Number" },
  { type: "private", label: "Private", icon: Car, numberLabel: "Service Reference" },
];

export default function LogisticsPanel({ open, onOpenChange, dayLabel, dateLabel, onAdd }: LogisticsPanelProps) {
  const [transportType, setTransportType] = useState<TransportType>("plane");
  const [transportNumber, setTransportNumber] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureLocation, setDepartureLocation] = useState("");
  const [arrivalLocation, setArrivalLocation] = useState("");

  const selectedOption = TRANSPORT_OPTIONS.find((o) => o.type === transportType)!;

  const canSubmit = departureLocation.trim() && arrivalLocation.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({
      transportType,
      transportNumber: transportNumber.trim(),
      departureTime: departureTime.trim(),
      arrivalTime: arrivalTime.trim(),
      departureLocation: departureLocation.trim(),
      arrivalLocation: arrivalLocation.trim(),
    });
    // Reset
    setTransportNumber("");
    setDepartureTime("");
    setArrivalTime("");
    setDepartureLocation("");
    setArrivalLocation("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col p-0 gap-0 border-l border-border">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Plane className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
            <span className="text-[9px] font-body font-bold uppercase tracking-widest text-primary">
              Add Transport
            </span>
          </div>
          <SheetTitle className="font-display text-lg font-medium tracking-tight text-foreground">
            {dayLabel}
          </SheetTitle>
          <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            {dateLabel} · Logistics
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Transport Type Selector */}
          <div>
            <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground mb-2 block">
              Type of Travel
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {TRANSPORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = transportType === opt.type;
                return (
                  <button
                    key={opt.type}
                    onClick={() => setTransportType(opt.type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-sm border transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    <span className="text-[8px] font-body font-bold uppercase tracking-widest">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transport Number */}
          <div>
            <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">
              {selectedOption.numberLabel}
            </Label>
            <Input
              value={transportNumber}
              onChange={(e) => setTransportNumber(e.target.value)}
              placeholder={
                transportType === "plane" ? "e.g., BA 283" :
                transportType === "train" ? "e.g., TGV 6171" :
                transportType === "bus" ? "e.g., FL 301" :
                "e.g., Blacklane REF-442"
              }
              className="h-9 text-sm font-body mt-1"
            />
          </div>

          {/* Departure & Arrival Locations */}
          <div className="space-y-3">
            <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground block">
              Route
            </Label>
            <div className="relative">
              <div className="space-y-2">
                <div>
                  <Label className="text-[9px] font-body uppercase tracking-widest text-muted-foreground/70">
                    From
                  </Label>
                  <Input
                    value={departureLocation}
                    onChange={(e) => setDepartureLocation(e.target.value)}
                    placeholder="Departure city or station"
                    className="h-9 text-sm font-body mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[9px] font-body uppercase tracking-widest text-muted-foreground/70">
                    To
                  </Label>
                  <Input
                    value={arrivalLocation}
                    onChange={(e) => setArrivalLocation(e.target.value)}
                    placeholder="Arrival city or station"
                    className="h-9 text-sm font-body mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">
                Departure Time
              </Label>
              <Input
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="e.g., 7:01 AM"
                className="h-9 text-sm font-body mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">
                Arrival Time
              </Label>
              <Input
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                placeholder="e.g., 10:17 AM"
                className="h-9 text-sm font-body mt-1"
              />
            </div>
          </div>

          {/* Preview */}
          {(departureLocation || arrivalLocation) && (
            <div className="border border-border rounded-sm p-3 bg-muted/20">
              <p className="text-[9px] font-body font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Preview
              </p>
              <div className="flex items-center gap-2 mb-1">
                {(() => {
                  const Icon = selectedOption.icon;
                  return <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />;
                })()}
                <span className="text-xs font-body font-medium text-foreground">
                  {transportNumber || selectedOption.label}
                </span>
              </div>
              <p className="text-[10px] font-body text-muted-foreground">
                {departureLocation || "—"} → {arrivalLocation || "—"}
              </p>
              {(departureTime || arrivalTime) && (
                <p className="text-[10px] font-body text-muted-foreground mt-0.5">
                  {departureTime || "—"} → {arrivalTime || "—"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="border-t border-border px-6 py-4 bg-muted/20">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-background bg-foreground rounded-sm px-3 py-2.5 hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" strokeWidth={2} />
            Add to Logistics
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
