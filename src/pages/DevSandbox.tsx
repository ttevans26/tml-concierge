import { useEffect } from "react";
import { ProfileProvider } from "@/contexts/ProfileContext";
import GlobalNav from "@/components/GlobalNav";
import GeminiConcierge from "@/components/GeminiConcierge";
import { useTripStore } from "@/stores/useTripStore";
import Home from "./Home";

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

function SandboxBanner() {
  return (
    <div className="sticky top-0 z-[100] bg-red-600 text-white text-center text-xs font-mono font-bold py-1.5 tracking-widest uppercase">
      Internal Sandbox — DB Disconnected
    </div>
  );
}

export default function DevSandbox() {
  const { setActiveTrip, setTrips, setItems, setTripsLoading, setItemsLoading } = useTripStore();

  useEffect(() => {
    setTrips([MOCK_TRIP]);
    setActiveTrip(MOCK_TRIP);
    setItems(MOCK_ITEMS);
    setTripsLoading(false);
    setItemsLoading(false);
  }, []);

  return (
    <ProfileProvider>
      <SandboxBanner />
      <div className="h-[calc(100vh-28px)] flex flex-col bg-background">
        <GlobalNav />
        <Home />
        <GeminiConcierge />
      </div>
    </ProfileProvider>
  );
}
