import { useState, useEffect, useRef, useCallback } from "react";
import { Plane, TrainFront, Bus, Car, Plus, CalendarIcon, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

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
  initialDate?: Date;
  onAdd: (entry: LogisticsEntry) => void;
}

const TRANSPORT_OPTIONS: { type: TransportType; label: string; icon: typeof Plane; numberLabel: string }[] = [
  { type: "plane", label: "Flight", icon: Plane, numberLabel: "Flight Number" },
  { type: "train", label: "Train", icon: TrainFront, numberLabel: "Train Number" },
  { type: "bus", label: "Bus", icon: Bus, numberLabel: "Bus Number" },
  { type: "private", label: "Private", icon: Car, numberLabel: "Service Reference" },
];

function formatFlightTime(isoTime: string): string {
  if (!isoTime) return "";
  try {
    const d = new Date(isoTime);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return isoTime;
  }
}

export default function LogisticsPanel({ open, onOpenChange, dayLabel, dateLabel, initialDate, onAdd }: LogisticsPanelProps) {
  const [transportType, setTransportType] = useState<TransportType>("plane");
  const [transportNumber, setTransportNumber] = useState("");
  const [travelDate, setTravelDate] = useState<Date | undefined>(initialDate);
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureLocation, setDepartureLocation] = useState("");
  const [arrivalLocation, setArrivalLocation] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lookupTimeout = useRef<ReturnType<typeof setTimeout>>();

  const selectedOption = TRANSPORT_OPTIONS.find((o) => o.type === transportType)!;

  // Auto-lookup when flight number changes (debounced) and type is "plane"
  const doFlightLookup = useCallback(async (flightNum: string, date?: Date) => {
    if (!flightNum.trim()) return;
    
    // Only auto-lookup for flights
    if (transportType !== "plane") return;

    // Validate format: 2 letters + digits
    const cleaned = flightNum.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}\d+$/.test(cleaned)) return;

    setLookupLoading(true);
    setLookupError(null);

    try {
      const dateStr = date ? format(date, "yyyy-MM-dd") : undefined;
      const { data, error } = await supabase.functions.invoke("flight-lookup", {
        body: { flightNumber: cleaned, date: dateStr },
      });

      if (error) {
        setLookupError("Lookup failed — fill in manually");
        setLookupLoading(false);
        return;
      }

      if (data?.success && data.flight) {
        const f = data.flight;
        setDepartureLocation(f.departureAirport ? `${f.departureAirport} (${f.departureIata})` : f.departureIata);
        setArrivalLocation(f.arrivalAirport ? `${f.arrivalAirport} (${f.arrivalIata})` : f.arrivalIata);
        setDepartureTime(formatFlightTime(f.departureTime));
        setArrivalTime(formatFlightTime(f.arrivalTime));
        setAutoFilled(true);
        setLookupError(null);
      } else {
        setLookupError(data?.error || "Flight not found — fill in manually");
      }
    } catch {
      setLookupError("Lookup unavailable — fill in manually");
    } finally {
      setLookupLoading(false);
    }
  }, [transportType]);

  // Debounced lookup trigger
  useEffect(() => {
    if (!transportNumber.trim() || !travelDate || transportType !== "plane") return;
    
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    lookupTimeout.current = setTimeout(() => {
      doFlightLookup(transportNumber, travelDate);
    }, 600);

    return () => { if (lookupTimeout.current) clearTimeout(lookupTimeout.current); };
  }, [transportNumber, travelDate, doFlightLookup]);

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
    setTravelDate(undefined);
    setDepartureTime("");
    setArrivalTime("");
    setDepartureLocation("");
    setArrivalLocation("");
    setAutoFilled(false);
    setLookupError(null);
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
            <div className="relative">
              <Input
                value={transportNumber}
                onChange={(e) => {
                  setTransportNumber(e.target.value);
                  setAutoFilled(false);
                  setLookupError(null);
                }}
                placeholder={
                  transportType === "plane" ? "e.g., DL5925 or BA283" :
                  transportType === "train" ? "e.g., TGV 6171" :
                  transportType === "bus" ? "e.g., FL 301" :
                  "e.g., Blacklane REF-442"
                }
                className="h-9 text-sm font-body mt-1"
              />
              {lookupLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" strokeWidth={1.5} />
                </div>
              )}
            </div>
            {transportType === "plane" && transportNumber.trim() && !lookupLoading && (
              <p className="text-[9px] font-body text-muted-foreground mt-1 italic">
                Route details will auto-populate when date is set
              </p>
            )}
          </div>

          {/* Travel Date */}
          <div>
            <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">
              Date of Travel
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-9 justify-start text-left text-sm font-body mt-1",
                    !travelDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
                  {travelDate ? format(travelDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={travelDate}
                  onSelect={setTravelDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {autoFilled && (
              <p className="text-[9px] font-body text-primary font-medium mt-1.5">
                ✦ Fields auto-populated from live flight data
              </p>
            )}
            {lookupError && (
              <p className="text-[9px] font-body text-muted-foreground mt-1.5 italic">
                {lookupError}
              </p>
            )}
          </div>

          {/* Route */}
          <div className="space-y-3">
            <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground block">
              Route
            </Label>
            <div className="space-y-2">
              <div>
                <Label className="text-[9px] font-body uppercase tracking-widest text-muted-foreground/70">
                  From
                </Label>
                <Input
                  value={departureLocation}
                  onChange={(e) => setDepartureLocation(e.target.value)}
                  placeholder="Departure city or station"
                  className={cn("h-9 text-sm font-body mt-1", autoFilled && "border-primary/30 bg-primary/5")}
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
                  className={cn("h-9 text-sm font-body mt-1", autoFilled && "border-primary/30 bg-primary/5")}
                />
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
                className={cn("h-9 text-sm font-body mt-1", autoFilled && "border-primary/30 bg-primary/5")}
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
                className={cn("h-9 text-sm font-body mt-1", autoFilled && "border-primary/30 bg-primary/5")}
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
