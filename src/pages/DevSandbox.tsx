import { useEffect, useState } from "react";
import { useTripStore } from "@/stores/useTripStore";
import { cn } from "@/lib/utils";

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
  { id: "s1", trip_id: MOCK_TRIP.id, type: "stay" as const, title: "The Connaught", subtitle: "London • Mayfair", date: "2026-08-21", day_index: 0, cost: 950, points_used: null, confirmation_code: "CONN-8821", cancellation_deadline: "2026-08-14", payment_status: "confirmed", latitude: 51.5113, longitude: -0.1489, time_label: "Check-in 3 PM", pro_tip: "Request a Cubitt room for park views", amex_fhr: true, pref_match: true, created_at: new Date().toISOString() },
  { id: "s2", trip_id: MOCK_TRIP.id, type: "flight" as const, title: "BA 572 → CDG", subtitle: "London Heathrow → Paris CDG", date: "2026-08-25", day_index: 4, cost: 320, points_used: null, confirmation_code: "BA-572X", cancellation_deadline: null, payment_status: "confirmed", latitude: null, longitude: null, time_label: "7:01 AM", pro_tip: "Use Amex Centurion Lounge T3", amex_fhr: false, pref_match: false, created_at: new Date().toISOString() },
  { id: "s3", trip_id: MOCK_TRIP.id, type: "stay" as const, title: "Hôtel Plaza Athénée", subtitle: "Paris • Avenue Montaigne", date: "2026-08-25", day_index: 4, cost: 1200, points_used: null, confirmation_code: "PLAZA-2508", cancellation_deadline: "2026-08-18", payment_status: "confirmed", latitude: 48.8661, longitude: 2.3044, time_label: "Check-in 2 PM", pro_tip: "Eiffel view suite upgrade often available", amex_fhr: true, pref_match: true, created_at: new Date().toISOString() },
  { id: "s4", trip_id: MOCK_TRIP.id, type: "dining" as const, title: "Le Cinq", subtitle: "Four Seasons George V", date: "2026-08-26", day_index: 5, cost: 450, points_used: null, confirmation_code: null, cancellation_deadline: null, payment_status: "pending", latitude: 48.8697, longitude: 2.3008, time_label: "8:00 PM", pro_tip: "3-star Michelin — book the garden terrace", amex_fhr: false, pref_match: true, created_at: new Date().toISOString() },
  { id: "s5", trip_id: MOCK_TRIP.id, type: "stay" as const, title: "Adler Spa Resort Dolomiti", subtitle: "Ortisei • Val Gardena", date: "2026-09-01", day_index: 11, cost: 680, points_used: null, confirmation_code: "ADLER-0109", cancellation_deadline: "2026-08-25", payment_status: "confirmed", latitude: 46.5735, longitude: 11.6717, time_label: "Check-in 2 PM", pro_tip: "Half-board included — skip lunch reservations", amex_fhr: false, pref_match: true, created_at: new Date().toISOString() },
];

const sandboxTabs = ["Overview", "Matrix", "Calendar", "Logistics"] as const;
type SandboxTab = typeof sandboxTabs[number];

function SandboxNav() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <span className="font-display text-base font-bold tracking-tight text-foreground">
        TML Concierge <span className="text-muted-foreground font-normal text-xs ml-2">sandbox</span>
      </span>
      <div className="flex gap-4 text-sm font-body text-muted-foreground">
        <span>Home</span>
        <span>Trips</span>
        <span>Studio</span>
        <span>Tools</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
        SB
      </div>
    </header>
  );
}

function SandboxCard({ item }: { item: { type: string; title: string | null; subtitle: string | null; time_label: string | null; cost: number | null; payment_status: string | null } }) {
  const typeColors: Record<string, string> = {
    stay: "border-l-emerald-500",
    flight: "border-l-sky-500",
    dining: "border-l-amber-500",
    logistics: "border-l-violet-500",
    agenda: "border-l-rose-500",
  };

  return (
    <div className={cn(
      "border border-border rounded-lg p-3 bg-card border-l-4",
      typeColors[item.type] ?? "border-l-muted"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-foreground truncate">{item.title}</p>
          <p className="font-body text-xs text-muted-foreground truncate">{item.subtitle}</p>
        </div>
        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{item.time_label}</span>
      </div>
      {item.cost && (
        <p className="mt-1.5 text-xs font-body text-muted-foreground">
          ${item.cost.toLocaleString()} • {item.payment_status}
        </p>
      )}
    </div>
  );
}

export default function DevSandbox() {
  const { setActiveTrip, setTrips, setItems, setTripsLoading, setItemsLoading } = useTripStore();
  const [tab, setTab] = useState<SandboxTab>("Overview");
  const items = useTripStore((s) => s.items);
  const activeTrip = useTripStore((s) => s.activeTrip);

  useEffect(() => {
    setTrips([MOCK_TRIP]);
    setActiveTrip(MOCK_TRIP);
    setItems(MOCK_ITEMS);
    setTripsLoading(false);
    setItemsLoading(false);
  }, []);

  const totalCost = items.reduce((sum, i) => sum + (i.cost ?? 0), 0);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Red sandbox banner */}
      <div className="sticky top-0 z-[100] bg-destructive text-destructive-foreground text-center text-xs font-mono font-bold py-1.5 tracking-widest uppercase">
        Internal Sandbox — DB Disconnected
      </div>

      {/* Mock nav — no auth, no links */}
      <SandboxNav />

      {/* Tab bar */}
      <div className="flex gap-1 px-6 pt-3 border-b border-border">
        {sandboxTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-body rounded-t-md transition-colors",
              tab === t
                ? "bg-card text-foreground border border-b-0 border-border font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "Overview" && activeTrip && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">{activeTrip.title}</h2>
              <p className="text-sm font-body text-muted-foreground mt-1">
                {activeTrip.destination} • {activeTrip.start_date} → {activeTrip.end_date}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">Total Cost</p>
                <p className="text-xl font-display font-bold text-foreground mt-1">${totalCost.toLocaleString()}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">Items</p>
                <p className="text-xl font-display font-bold text-foreground mt-1">{items.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">Nightly Budget</p>
                <p className="text-xl font-display font-bold text-foreground mt-1">${activeTrip.target_nightly_budget}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-body text-sm font-semibold text-foreground uppercase tracking-wide">Itinerary Items</h3>
              {items.map((item) => (
                <SandboxCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {tab !== "Overview" && (
          <div className="flex items-center justify-center h-64 text-muted-foreground font-body text-sm">
            <p>{tab} view — sandbox placeholder</p>
          </div>
        )}
      </div>
    </div>
  );
}
