import { useState } from "react";
import { Plane, Clock, MapPin, AlertTriangle, RefreshCw, Plus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useFlightTracking, useAddFlight, useLookupAndAddFlight, type FlightRecord } from "@/hooks/useFlightTracking";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "bg-forest/10", text: "text-forest", label: "Scheduled" },
  "on-time": { bg: "bg-forest/10", text: "text-forest", label: "On Time" },
  delayed: { bg: "bg-amber-100", text: "text-amber-700", label: "Delayed" },
  cancelled: { bg: "bg-destructive/10", text: "text-destructive", label: "Cancelled" },
  landed: { bg: "bg-muted", text: "text-muted-foreground", label: "Landed" },
  "in-air": { bg: "bg-blue-100", text: "text-blue-700", label: "In Air" },
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

interface FlightTrackerProps {
  tripId: string | undefined;
  mockFlights?: FlightRecord[];
  onAddFlight?: (flight: Omit<FlightRecord, "id" | "created_at" | "last_checked_at" | "user_id">) => void;
}

export default function FlightTracker({ tripId, mockFlights, onAddFlight }: FlightTrackerProps) {
  const isMock = !!mockFlights;
  const { data: liveFlights = [], isLoading: liveLoading } = useFlightTracking(isMock ? undefined : tripId);
  const addFlight = useAddFlight();
  const lookupAndAdd = useLookupAndAddFlight();
  const flights = isMock ? mockFlights : liveFlights;
  const isLoading = isMock ? false : liveLoading;
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newFlight, setNewFlight] = useState({ flight_number: "", flight_date: "" });

  const isSubmitting = addFlight.isPending || lookupAndAdd.isPending;

  const handleAdd = () => {
    if (!newFlight.flight_number) return;

    // Mock/sandbox mode — use callback
    if (onAddFlight) {
      onAddFlight({
        trip_id: tripId || "sandbox",
        flight_number: newFlight.flight_number.toUpperCase(),
        flight_date: newFlight.flight_date || null,
        airline: null, departure_airport: null, arrival_airport: null,
        departure_time: null, arrival_time: null, status: "scheduled",
        gate: null, terminal: null, delay_minutes: 0,
        aircraft_type: null, notes: null,
      });
      setNewFlight({ flight_number: "", flight_date: "" });
      setShowAdd(false);
      return;
    }

    // Production mode — lookup via edge function then save
    if (tripId) {
      lookupAndAdd.mutate(
        { flightNumber: newFlight.flight_number, date: newFlight.flight_date || undefined, tripId },
        {
          onSuccess: (data) => {
            // Detect if fallback mock data was used (JFK→LHR pattern)
            const isSimulated = data?.departure_airport === "JFK" && data?.arrival_airport === "LHR";
            toast({
              title: isSimulated ? "Flight tracked (Simulated data)" : "Flight tracked",
              description: isSimulated
                ? `${newFlight.flight_number.toUpperCase()} saved with demo data.`
                : `${newFlight.flight_number.toUpperCase()} added with live data.`,
            });
            setNewFlight({ flight_number: "", flight_date: "" });
            setShowAdd(false);
          },
          onError: (e) => {
            toast({ title: "Error", description: e.message, variant: "destructive" });
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flights.length === 0 && !showAdd && (
        <div className="text-center py-6 border border-dashed border-border rounded-sm">
          <Plane className="w-5 h-5 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-widest">
            No flights tracked
          </p>
        </div>
      )}

      {flights.map((flight) => {
        const status = STATUS_STYLES[flight.status || "scheduled"] || STATUS_STYLES.scheduled;
        const isExpanded = expandedId === flight.id;
        return (
          <div
            key={flight.id}
            className="border border-border rounded-sm overflow-hidden bg-background transition-shadow hover:shadow-sm"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : flight.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
            >
              <Plane className="w-3.5 h-3.5 text-forest shrink-0" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-body font-medium text-foreground">
                    {flight.airline ? `${flight.airline} ` : ""}{flight.flight_number}
                  </span>
                  <span className={cn("text-[8px] font-body font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm", status.bg, status.text)}>
                    {status.label}
                  </span>
                  {flight.delay_minutes && flight.delay_minutes > 0 && (
                    <span className="text-[8px] font-body font-bold text-amber-700">
                      +{flight.delay_minutes}m
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-body text-muted-foreground">
                  {flight.departure_airport || "TBD"} → {flight.arrival_airport || "TBD"}
                  {flight.flight_date && <span className="ml-1.5">· {formatDate(flight.flight_date)}</span>}
                </p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 text-muted-foreground shrink-0" strokeWidth={1.5} />
              ) : (
                <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" strokeWidth={1.5} />
              )}
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 border-t border-border pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] font-body text-muted-foreground uppercase tracking-widest">Depart</span>
                    <p className="text-xs font-body font-medium text-foreground">{formatTime(flight.departure_time)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-body text-muted-foreground uppercase tracking-widest">Arrive</span>
                    <p className="text-xs font-body font-medium text-foreground">{formatTime(flight.arrival_time)}</p>
                  </div>
                </div>
                {(flight.gate || flight.terminal) && (
                  <div className="grid grid-cols-2 gap-2">
                    {flight.terminal && (
                      <div>
                        <span className="text-[9px] font-body text-muted-foreground uppercase tracking-widest">Terminal</span>
                        <p className="text-xs font-body font-medium text-foreground">{flight.terminal}</p>
                      </div>
                    )}
                    {flight.gate && (
                      <div>
                        <span className="text-[9px] font-body text-muted-foreground uppercase tracking-widest">Gate</span>
                        <p className="text-xs font-body font-medium text-foreground">{flight.gate}</p>
                      </div>
                    )}
                  </div>
                )}
                {flight.aircraft_type && (
                  <div>
                    <span className="text-[9px] font-body text-muted-foreground uppercase tracking-widest">Aircraft</span>
                    <p className="text-xs font-body font-medium text-foreground">{flight.aircraft_type}</p>
                  </div>
                )}
                {flight.notes && (
                  <p className="text-[10px] font-body text-muted-foreground italic">{flight.notes}</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add flight form */}
      {showAdd ? (
        <div className="border border-forest/30 rounded-sm p-3 space-y-2 bg-forest/5">
          <Input
            placeholder="Flight number (e.g. BA123)"
            value={newFlight.flight_number}
            onChange={(e) => setNewFlight((p) => ({ ...p, flight_number: e.target.value }))}
            className="h-7 text-xs font-body"
          />
          <Input
            type="date"
            value={newFlight.flight_date}
            onChange={(e) => setNewFlight((p) => ({ ...p, flight_date: e.target.value }))}
            className="h-7 text-xs font-body"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newFlight.flight_number || isSubmitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-body font-medium uppercase tracking-widest bg-forest text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? <><Loader2 className="w-3 h-3 animate-spin" /> Looking up…</> : "Track Flight"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-[10px] font-body text-muted-foreground border border-border rounded-sm hover:bg-muted/30"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-sm text-[10px] font-body text-muted-foreground hover:border-forest/40 hover:text-forest transition-colors"
        >
          <Plus className="w-3 h-3" strokeWidth={1.5} />
          Track a Flight
        </button>
      )}
    </div>
  );
}
