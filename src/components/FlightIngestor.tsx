import { useState } from "react";
import { Plane, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FlightData {
  flightNumber: string;
  date: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  status: string;
}

const MOCK_FLIGHTS: Record<string, Omit<FlightData, "flightNumber" | "date">> = {
  DL456: { departure: "LAX", arrival: "VCE", departureTime: "5:30 PM", arrivalTime: "2:15 PM+1", airline: "Delta Air Lines", status: "On Time" },
  DL178: { departure: "LAX", arrival: "NRT", departureTime: "11:00 AM", arrivalTime: "3:40 PM+1", airline: "Delta Air Lines", status: "On Time" },
  BA217: { departure: "LHR", arrival: "JFK", departureTime: "9:15 AM", arrivalTime: "12:30 PM", airline: "British Airways", status: "On Time" },
  AA100: { departure: "JFK", arrival: "LHR", departureTime: "7:00 PM", arrivalTime: "7:05 AM+1", airline: "American Airlines", status: "On Time" },
  UA901: { departure: "SFO", arrival: "FCO", departureTime: "6:45 PM", arrivalTime: "3:10 PM+1", airline: "United Airlines", status: "On Time" },
};

interface FlightIngestorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFlightAdd: (flight: FlightData) => void;
}

export default function FlightIngestor({ open, onOpenChange, onFlightAdd }: FlightIngestorProps) {
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState("");
  const [result, setResult] = useState<FlightData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLookup = () => {
    setError("");
    setResult(null);
    setLoading(true);

    const code = flightNumber.toUpperCase().replace(/[^A-Z0-9]/g, "");

    setTimeout(() => {
      const match = MOCK_FLIGHTS[code];
      if (match) {
        const data: FlightData = { flightNumber: code, date, ...match };
        setResult(data);
      } else {
        setError(`No data found for "${code}". Try DL456, BA217, AA100, or UA901.`);
      }
      setLoading(false);
    }, 800);
  };

  const handleConfirm = () => {
    if (result) {
      onFlightAdd(result);
      setFlightNumber("");
      setDate("");
      setResult(null);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setFlightNumber("");
    setDate("");
    setResult(null);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-medium flex items-center gap-2">
            <Plane className="w-4 h-4 text-forest" strokeWidth={1.5} />
            Flight Ingestor
          </DialogTitle>
          <DialogDescription className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            Enter a flight number to auto-populate logistics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Flight Number
              </label>
              <Input
                placeholder="e.g. DL456"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="font-body text-sm h-9"
              />
            </div>
            <div>
              <label className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block">
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-body text-sm h-9"
              />
            </div>
          </div>

          <Button
            onClick={handleLookup}
            disabled={!flightNumber || !date || loading}
            className="w-full bg-forest text-background hover:bg-forest/90 font-body text-xs tracking-wider uppercase h-9"
          >
            {loading ? "Looking up…" : "Look Up Flight"}
          </Button>

          {error && (
            <p className="text-[11px] font-body text-destructive">{error}</p>
          )}

          {result && (
            <div className="border border-forest/30 rounded-sm p-4 bg-forest/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-medium text-foreground">
                  {result.airline} · {result.flightNumber}
                </span>
                <span className="text-[10px] font-body font-medium uppercase tracking-widest text-forest">
                  {result.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-body text-muted-foreground">
                <span>{result.departure} {result.departureTime}</span>
                <span className="text-forest">→</span>
                <span>{result.arrival} {result.arrivalTime}</span>
              </div>
              <p className="text-[10px] font-body text-muted-foreground">{result.date}</p>
              <p className="text-[10px] font-body font-medium text-forest mt-1">
                ✦ Use Amex Platinum for 5x points on flights.
              </p>

              <Button
                onClick={handleConfirm}
                className="w-full mt-2 bg-foreground text-background hover:bg-foreground/90 font-body text-xs tracking-wider uppercase h-9"
              >
                Add to Logistics
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
