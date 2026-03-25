import { useEffect, useState, useMemo, Component, ErrorInfo, ReactNode, createContext } from "react";
import { Plane, Hotel, MapPin, Utensils, AlertTriangle, Clock, Info, Plus, LayoutGrid, Calendar, Sparkles } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
import { tripRecordToTripData, type TripData } from "@/lib/tripTransforms";
import { detectHomelessNights, detectTimeConflicts, isDayHomeless, hasDayConflict } from "@/lib/conflictDetector";
import LogisticsSidebar from "@/components/LogisticsSidebar";
import BudgetBar from "@/components/BudgetBar";
import ItineraryLockBanner from "@/components/ItineraryLockBanner";
import type { FlightRecord } from "@/hooks/useFlightTracking";
import { cn } from "@/lib/utils";

// ── Mock Auth & Profile contexts to prevent crashes ──

// Mock profile data (standalone, no auth dependency)
import type { RewardCard, TravelPreferences, BudgetData } from "@/contexts/ProfileContext";

const mockCards: RewardCard[] = [
  { id: "amex-plat", name: "Amex Platinum", shortName: "Amex Plat", earn: "5x", categories: ["flight"], owned: true },
  { id: "csr", name: "Chase Sapphire Reserve", shortName: "CSR", earn: "3x", categories: ["dining", "transit", "stay"], owned: true },
  { id: "amex-gold", name: "Amex Gold", shortName: "Amex Gold", earn: "4x", categories: ["dining"], owned: false },
];

const mockPrefs: TravelPreferences = { adultsOnly: false, saunaGym: true, spa: true, targetNightlyRate: 400 };
const mockBudget: BudgetData = { totalSpent: 9375, nightsBooked: 27, splurgeCredit: 500 };

// We need to provide values via the REAL ProfileContext so useProfile() works
// The real context is not exported, so we use the ProfileProvider approach differently:
// We'll create a wrapper that doesn't use auth

/* ── Mock Data ── */

const MOCK_TRIP = {
  id: "sandbox-europe-2026",
  user_id: "sandbox-user",
  title: "Europe 2026",
  destination: "Italy, France, England",
  start_date: "2026-08-21",
  end_date: "2026-09-17",
  target_nightly_budget: 400,
  is_published: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_ITEMS = [
  { id: "s1", trip_id: MOCK_TRIP.id, type: "stay" as const, title: "The Connaught", subtitle: "London · Mayfair", date: "2026-08-21", day_index: 0, cost: 950, points_used: null, confirmation_code: "CONN-8821", cancellation_deadline: "2026-08-14", payment_status: "confirmed", latitude: 51.5113, longitude: -0.1489, time_label: "Check-in 3 PM", pro_tip: "Request a Cubitt room for park views", amex_fhr: true, pref_match: true, created_at: new Date().toISOString() },
  { id: "s1b", trip_id: MOCK_TRIP.id, type: "stay" as const, title: "The Connaught", subtitle: "London · Night 2", date: "2026-08-22", day_index: 1, cost: 950, points_used: null, confirmation_code: "CONN-8821", cancellation_deadline: "2026-08-14", payment_status: "confirmed", latitude: 51.5113, longitude: -0.1489, time_label: null, pro_tip: null, amex_fhr: true, pref_match: true, created_at: new Date().toISOString() },
  { id: "s1c", trip_id: MOCK_TRIP.id, type: "stay" as const, title: "The Connaught", subtitle: "London · Night 3", date: "2026-08-23", day_index: 2, cost: 950, points_used: null, confirmation_code: "CONN-8821", cancellation_deadline: "2026-08-14", payment_status: "confirmed", latitude: 51.5113, longitude: -0.1489, time_label: null, pro_tip: null, amex_fhr: true, pref_match: true, created_at: new Date().toISOString() },
  { id: "s1d", trip_id: MOCK_TRIP.id, type: "stay" as const, title: "The Connaught", subtitle: "London · Night 4", date: "2026-08-24", day_index: 3, cost: 950, points_used: null, confirmation_code: "CONN-8821", cancellation_deadline: "2026-08-14", payment_status: "confirmed", latitude: 51.5113, longitude: -0.1489, time_label: null, pro_tip: null, amex_fhr: true, pref_match: true, created_at: new Date().toISOString() },
  { id: "s2", trip_id: MOCK_TRIP.id, type: "flight" as const, title: "BA 572 → CDG", subtitle: "London Heathrow → Paris CDG", date: "2026-08-25", day_index: 4, cost: 320, points_used: null, confirmation_code: "BA-572X", cancellation_deadline: null, payment_status: "confirmed", latitude: null, longitude: null, time_label: "7:01 AM", pro_tip: "Use Amex Centurion Lounge T3", amex_fhr: false, pref_match: false, created_at: new Date().toISOString() },
  { id: "s3", trip_id: MOCK_TRIP.id, type: "stay" as const, title: "Hôtel Plaza Athénée", subtitle: "Paris · Avenue Montaigne", date: "2026-08-25", day_index: 4, cost: 1200, points_used: null, confirmation_code: "PLAZA-2508", cancellation_deadline: "2026-08-18", payment_status: "confirmed", latitude: 48.8661, longitude: 2.3044, time_label: "Check-in 2 PM", pro_tip: "Eiffel view suite upgrade often available", amex_fhr: true, pref_match: true, created_at: new Date().toISOString() },
  { id: "s3b", trip_id: MOCK_TRIP.id, type: "stay" as const, title: "Hôtel Plaza Athénée", subtitle: "Paris · Night 2", date: "2026-08-26", day_index: 5, cost: 1200, points_used: null, confirmation_code: "PLAZA-2508", cancellation_deadline: "2026-08-18", payment_status: "confirmed", latitude: 48.8661, longitude: 2.3044, time_label: null, pro_tip: null, amex_fhr: true, pref_match: true, created_at: new Date().toISOString() },
  { id: "s4", trip_id: MOCK_TRIP.id, type: "dining" as const, title: "Le Cinq", subtitle: "Four Seasons George V", date: "2026-08-26", day_index: 5, cost: 450, points_used: null, confirmation_code: null, cancellation_deadline: null, payment_status: "pending", latitude: 48.8697, longitude: 2.3008, time_label: "8:00 PM", pro_tip: "3-star Michelin — book the garden terrace", amex_fhr: false, pref_match: true, created_at: new Date().toISOString() },
  { id: "s5", trip_id: MOCK_TRIP.id, type: "stay" as const, title: "Adler Spa Resort Dolomiti", subtitle: "Ortisei · Val Gardena", date: "2026-09-01", day_index: 11, cost: 680, points_used: null, confirmation_code: "ADLER-0109", cancellation_deadline: "2026-08-25", payment_status: "confirmed", latitude: 46.5735, longitude: 11.6717, time_label: "Check-in 2 PM", pro_tip: "Half-board included — skip lunch reservations", amex_fhr: false, pref_match: true, created_at: new Date().toISOString() },
  { id: "s6", trip_id: MOCK_TRIP.id, type: "dining" as const, title: "Trattoria da Mario", subtitle: "Ortisei · Centro", date: "2026-09-01", day_index: 11, cost: 95, points_used: null, confirmation_code: null, cancellation_deadline: null, payment_status: "pending", latitude: 46.574, longitude: 11.672, time_label: "7:30 PM", pro_tip: "Try the wild boar ragu", amex_fhr: false, pref_match: true, created_at: new Date().toISOString() },
];

const MOCK_FLIGHTS: FlightRecord[] = [
  {
    id: "mf-1", trip_id: MOCK_TRIP.id, user_id: "sandbox-user",
    flight_number: "DL-178", airline: "Delta",
    departure_airport: "MXP", arrival_airport: "LAX",
    departure_time: "2026-09-17T10:30:00Z", arrival_time: "2026-09-17T14:45:00Z",
    flight_date: "2026-09-17", status: "scheduled",
    gate: "B42", terminal: "1", delay_minutes: 0,
    aircraft_type: "A330-900neo", notes: "Final leg home — Comfort+ upgrade pending",
    last_checked_at: new Date().toISOString(), created_at: new Date().toISOString(),
  },
  {
    id: "mf-2", trip_id: MOCK_TRIP.id, user_id: "sandbox-user",
    flight_number: "BA-572", airline: "British Airways",
    departure_airport: "LHR", arrival_airport: "CDG",
    departure_time: "2026-08-25T07:01:00Z", arrival_time: "2026-08-25T09:15:00Z",
    flight_date: "2026-08-25", status: "on-time",
    gate: "A14", terminal: "5", delay_minutes: 0,
    aircraft_type: "A320", notes: null,
    last_checked_at: new Date().toISOString(), created_at: new Date().toISOString(),
  },
];

/* ── Error Boundary ── */
interface EBState { hasError: boolean; error: Error | null }

class SandboxErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Sandbox Error]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="m-6 p-6 border-2 border-destructive rounded-lg bg-destructive/5">
          <h2 className="text-lg font-display font-bold text-destructive mb-2">Sandbox Crash</h2>
          <p className="font-mono text-sm text-destructive mb-4">{this.state.error?.message}</p>
          <pre className="text-xs text-muted-foreground font-mono overflow-auto max-h-40 bg-muted p-3 rounded">
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Countdown helper ── */
function getCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d remaining`;
}

/* ── Sandbox Nav ── */
function SandboxNav() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <span className="font-display text-base font-bold tracking-tight text-foreground">
        TML Concierge <span className="text-muted-foreground font-normal text-xs ml-2">sandbox</span>
      </span>
      <div className="flex gap-4 text-sm font-body text-muted-foreground">
        <span>Home</span><span>Trips</span><span>Studio</span><span>Tools</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">SB</div>
    </header>
  );
}

/* ── Sandbox Budget Bar (standalone, no useProfile) ── */
function SandboxBudgetBar() {
  const items = useTripStore((s) => s.items);
  const totalCost = items.reduce((sum, i) => sum + (i.cost ?? 0), 0);
  const nightsBooked = items.filter((i) => i.type === "stay").length;
  const avgNightly = nightsBooked > 0 ? Math.round(totalCost / nightsBooked) : 0;
  const targetNightly = 400;
  const splurgeCredit = Math.max(0, (targetNightly * nightsBooked) - totalCost);

  return (
    <div className="flex items-center gap-6 px-8 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">Total</span>
        <span className="text-sm font-display font-bold text-foreground">${totalCost.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">Avg/Night</span>
        <span className="text-sm font-display font-bold text-foreground">${avgNightly}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">Splurge Credit</span>
        <span className={cn("text-sm font-display font-bold", splurgeCredit > 0 ? "text-forest" : "text-destructive")}>
          ${splurgeCredit.toLocaleString()}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">Nights</span>
        <span className="text-sm font-display font-bold text-foreground">{nightsBooked}</span>
      </div>
    </div>
  );
}

/* ── Sandbox Matrix View (self-contained, no auth deps) ── */
function SandboxMatrixView({ trip }: { trip: TripData }) {
  const [hoveredDeadline, setHoveredDeadline] = useState<string | null>(null);
  const [hoveredEmpty, setHoveredEmpty] = useState<string | null>(null);

  const homelessNights = useMemo(() => detectHomelessNights(trip), [trip]);
  const timeConflicts = useMemo(() => detectTimeConflicts(trip), [trip]);

  return (
    <div className="h-full flex flex-col">
      <SandboxBudgetBar />
      <ItineraryLockBanner trip={trip} onLock={() => {}} />

      {/* Header */}
      <div className="px-8 py-5 border-b border-border flex items-center gap-4">
        <div className="flex-1">
          <h2 className="font-display text-xl font-medium text-foreground">{trip.destination}</h2>
          <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">{trip.dates}</p>
        </div>
        <div className="flex items-center border border-border rounded-sm overflow-hidden">
          <div className="flex items-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest px-3 py-1.5 bg-foreground text-background">
            <LayoutGrid className="w-3 h-3" strokeWidth={1.5} />
            Deep Dive
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Matrix Grid */}
        <div className="flex-1 overflow-auto" style={{ backgroundColor: '#F5F2ED' }}>
          <div className="min-w-max">
            {/* Column headers */}
            <div className="flex sticky top-0 z-20" style={{ borderBottom: '2px solid #D1D1D1' }}>
              <div className="w-32 shrink-0 px-4 py-3 sticky left-0 z-30" style={{ borderRight: '2px solid #D1D1D1', backgroundColor: '#F5F2ED' }} />
              {trip.dayLabels.map((label, dayIdx) => {
                const stayRow = trip.rows.find((r) => r.type === "stay");
                const logisticsRow = trip.rows.find((r) => r.type === "logistics");
                const hasStay = stayRow?.cells[dayIdx] != null;
                const hasLogistics = logisticsRow?.cells[dayIdx] != null;
                const hasGap = !hasStay && !hasLogistics;
                return (
                  <div
                    key={`${label}-${dayIdx}`}
                    data-day-idx={dayIdx}
                    className={cn(
                      "w-64 shrink-0 px-4 py-3 text-[11px] font-body font-medium uppercase tracking-widest",
                      hasGap ? "text-amber-700" : "text-muted-foreground",
                    )}
                    style={{
                      borderRight: '2px solid #D1D1D1',
                      backgroundColor: hasGap ? '#FFF8ED' : dayIdx % 2 === 1 ? '#EBE7E0' : '#F5F2ED',
                    }}
                  >
                    <span className="truncate">{label}</span>
                    {hasGap && isDayHomeless(homelessNights, dayIdx) && (
                      <span className="flex items-center gap-1 text-[9px] font-body font-bold tracking-widest text-amber-600 mt-0.5 normal-case">
                        <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2} />
                        Homeless Night
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {trip.rows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex" style={{ borderBottom: '1px solid #D1D1D1' }}>
                  <div
                    className={cn(
                      "w-32 shrink-0 px-4 py-5 flex items-center gap-2 sticky left-0 z-10",
                      row.type === "logistics" && "border-l-[3px] border-l-blue-500",
                      row.type === "stay" && "border-l-[3px] border-l-emerald-500",
                      row.type === "agenda" && "border-l-[3px] border-l-amber-500",
                      row.type === "dining" && "border-l-[3px] border-l-rose-500",
                    )}
                    style={{ borderRight: '2px solid #D1D1D1', backgroundColor: '#F5F2ED' }}
                  >
                    <Icon className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                    <span className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                      {row.label}
                    </span>
                  </div>

                  {row.cells.map((cell, idx) => {
                    const cellKey = `${row.type}-${idx}`;
                    const isHoveredEmpty = hoveredEmpty === cellKey;
                    return (
                      <div
                        key={idx}
                        className="w-64 shrink-0 px-4 py-4 cursor-pointer hover:brightness-[0.97] transition-colors"
                        style={{
                          borderRight: '2px solid #D1D1D1',
                          backgroundColor: idx % 2 === 1 ? '#EBE7E0' : '#F5F2ED',
                        }}
                        onMouseEnter={() => { if (!cell) setHoveredEmpty(cellKey); }}
                        onMouseLeave={() => setHoveredEmpty(null)}
                      >
                        {cell ? (
                          <div
                            className={cn(
                              "border rounded-sm p-3.5 transition-shadow relative",
                              cell.status === "hold" ? "border-amber-500/50" : cell.status === "paid" ? "border-forest/40" : "border-border",
                              row.type === "logistics" && hasDayConflict(timeConflicts, idx) && "border-destructive/60 bg-destructive/5 ring-1 ring-destructive/20"
                            )}
                            style={{ backgroundColor: hasDayConflict(timeConflicts, idx) && row.type === "logistics" ? undefined : '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                          >
                            {row.type === "logistics" && hasDayConflict(timeConflicts, idx) && (
                              <div className="flex items-center gap-1 mb-2 px-1.5 py-1 rounded-sm bg-destructive/10">
                                <Clock className="w-2.5 h-2.5 text-destructive shrink-0" strokeWidth={2} />
                                <span className="text-[8px] font-body font-bold uppercase tracking-widest text-destructive">Time Conflict</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-body font-medium text-foreground truncate">{cell.title}</span>
                                {cell.prefMatch && (
                                  <span className="flex items-center gap-0.5 text-[8px] font-body font-bold uppercase tracking-widest bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm shrink-0">
                                    <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                                    Match
                                  </span>
                                )}
                              </div>
                              {cell.cancellationDeadline && (
                                <div
                                  className="relative"
                                  onMouseEnter={() => setHoveredDeadline(`${row.label}-${idx}`)}
                                  onMouseLeave={() => setHoveredDeadline(null)}
                                >
                                  <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-forest cursor-help shrink-0" strokeWidth={1.5} />
                                  {hoveredDeadline === `${row.label}-${idx}` && (
                                    <div className="absolute right-0 top-5 z-20 bg-foreground text-background text-[10px] font-body px-3 py-2 rounded-sm whitespace-nowrap shadow-lg">
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" strokeWidth={1.5} />
                                        Cancel by {cell.cancellationLabel}
                                      </div>
                                      <div className="text-background/70 mt-0.5">{getCountdown(cell.cancellationDeadline!)}</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-body text-muted-foreground truncate">{cell.subtitle}</p>
                            {cell.time && <p className="text-[10px] font-body text-muted-foreground mt-1">{cell.time}</p>}
                            {cell.confirmation && (
                              <p className="text-[10px] font-body text-muted-foreground mt-1.5">
                                Conf: <span className="text-foreground font-medium tracking-wide">{cell.confirmation}</span>
                              </p>
                            )}
                            {cell.price && <p className="text-[10px] font-body text-muted-foreground mt-0.5">{cell.price}</p>}
                            {cell.proTip && <p className="mt-2 text-[10px] font-body font-medium text-forest">✦ {cell.proTip}</p>}
                          </div>
                        ) : (
                          (() => {
                            const homeless = row.type === "stay" && isDayHomeless(homelessNights, idx);
                            return (
                              <div className={cn(
                                "border rounded-sm py-6 flex flex-col items-center justify-center text-[10px] font-body text-muted-foreground transition-colors",
                                homeless ? "border-amber-400 bg-amber-50/50 border-dashed" : "border-dashed border-border"
                              )}>
                                {homeless ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-500" strokeWidth={1.5} />
                                    <span className="text-[8px] font-body font-semibold text-amber-600 uppercase tracking-widest">Stay Required</span>
                                  </div>
                                ) : isHoveredEmpty ? (
                                  <Plus className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                                ) : "—"}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Logistics Sidebar (real component, mock flights) */}
        <div className="w-72 shrink-0 border-l border-border bg-background overflow-hidden">
          <LogisticsSidebar
            trip={trip}
            onLock={() => {}}
            tripId={MOCK_TRIP.id}
            mockFlights={MOCK_FLIGHTS}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Main Sandbox Component ── */
export default function DevSandbox() {
  const { setActiveTrip, setTrips, setItems, setTripsLoading, setItemsLoading } = useTripStore();

  useEffect(() => {
    setTrips([MOCK_TRIP]);
    setActiveTrip(MOCK_TRIP);
    setItems(MOCK_ITEMS);
    setTripsLoading(false);
    setItemsLoading(false);
  }, []);

  const tripData = useMemo(() => tripRecordToTripData(MOCK_TRIP, MOCK_ITEMS), []);

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-[100] bg-destructive text-destructive-foreground text-center text-xs font-mono font-bold py-1.5 tracking-widest uppercase">
        Internal Sandbox — DB Disconnected
      </div>
      <SandboxNav />
      <SandboxErrorBoundary>
        <div className="flex-1 overflow-hidden">
          <SandboxMatrixView trip={tripData} />
        </div>
      </SandboxErrorBoundary>
    </div>
  );
}
