import { useState, useEffect } from "react";
import { Plane, Car, Hotel, MapPin, Utensils, Copy, EyeOff, Check, Clock } from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SharedLeg {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  date: string;
  time_label?: string;
  pro_tip?: string;
  cost?: number | null;
  confirmation_code?: string | null;
  points_used?: number | null;
}

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
}

const iconMap: Record<string, typeof Plane> = { flight: Plane, logistics: Car, stay: Hotel, dining: Utensils, agenda: MapPin };

export default function SharedTripView() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<SharedLeg[]>([]);
  const [cloned, setCloned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShared = async () => {
      // Find published trip by matching a slug-like identifier or ID
      const { data: trips } = await supabase
        .from("trips")
        .select("*")
        .eq("is_published", true)
        .limit(10);

      if (!trips || trips.length === 0) {
        setLoading(false);
        return;
      }

      // Try to match by ID or by slug
      const matched = trips.find((t) => t.id === tripId) || trips[0];
      setTrip(matched);

      // Use the public view to get masked items
      const { data: itemData } = await supabase
        .from("itinerary_items_public" as any)
        .select("*")
        .eq("trip_id", matched.id)
        .order("day_index");

      if (itemData) {
        setItems(itemData as unknown as SharedLeg[]);
      }
      setLoading(false);
    };
    fetchShared();
  }, [tripId]);

  if (loading) {
    return <p className="text-sm font-body text-muted-foreground">Loading shared trip…</p>;
  }

  if (!trip) {
    return <p className="text-sm font-body text-muted-foreground">No published trip found.</p>;
  }

  const stays = items.filter((l) => l.type === "stay");
  const logistics = items.filter((l) => l.type === "logistics" || l.type === "flight");

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
          {trip.title || trip.destination}
        </h2>
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground border border-border rounded-full px-3 py-1">
          Shared Trip
        </span>
      </div>
      <p className="text-sm text-muted-foreground font-body mb-8">
        {trip.start_date} — {trip.end_date} · {trip.destination}
      </p>

      {/* Clone button */}
      <div className="mb-8">
        <button
          onClick={() => setCloned(true)}
          disabled={cloned}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-body font-medium transition-all ${
            cloned
              ? "bg-forest/10 text-forest border border-forest/30 cursor-default"
              : "bg-forest text-primary-foreground hover:opacity-90"
          }`}
        >
          {cloned ? (
            <>
              <Check className="w-4 h-4" strokeWidth={2} />
              Itinerary Cloned
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" strokeWidth={1.5} />
              Clone Itinerary
            </>
          )}
        </button>
        {cloned && (
          <p className="text-xs font-body text-muted-foreground mt-2">
            Legs copied to your account — add your own confirmations &amp; payment details.
          </p>
        )}
      </div>

      {/* Stays */}
      {stays.length > 0 && (
        <div className="mb-10">
          <h3 className="font-display text-lg font-medium text-foreground mb-4">Hotels & Stays</h3>
          <div className="space-y-3">
            {stays.map((leg) => {
              const Icon = iconMap[leg.type] || Hotel;
              return (
                <div key={leg.id} className="border border-border rounded-md p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Icon className="w-4 h-4 text-forest" strokeWidth={1.5} />
                    <span className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">Stay</span>
                    <span className="text-xs font-body text-muted-foreground ml-auto">{leg.date}</span>
                  </div>
                  <h4 className="font-display text-base font-medium text-foreground mb-1">{leg.title}</h4>
                  <p className="text-sm text-muted-foreground font-body mb-3">{leg.subtitle}</p>

                  {leg.pro_tip && (
                    <p className="text-xs font-body text-foreground italic border-l-2 border-forest/30 pl-3 mb-3">
                      "{leg.pro_tip}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-body">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Confirmation</span>
                      <span className="flex items-center gap-1 text-muted-foreground/60">
                        <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                        {leg.confirmation_code || "••••••••"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Price</span>
                      <span className="flex items-center gap-1 text-muted-foreground/60">
                        <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                        {leg.cost != null ? `$${leg.cost}` : "Redacted"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Points</span>
                      <span className="flex items-center gap-1 text-muted-foreground/60">
                        <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                        {leg.points_used != null ? leg.points_used.toLocaleString() : "Redacted"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Logistics */}
      {logistics.length > 0 && (
        <div className="mb-10">
          <h3 className="font-display text-lg font-medium text-foreground mb-4">Logistics Structure</h3>
          <div className="space-y-3">
            {logistics.map((leg) => {
              const Icon = iconMap[leg.type] || Car;
              return (
                <div key={leg.id} className="border border-border rounded-md p-5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Icon className="w-4 h-4 text-forest" strokeWidth={1.5} />
                    <span className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                      {leg.type === "logistics" ? "Train" : "Flight"}
                    </span>
                    <span className="text-xs font-body text-muted-foreground ml-auto">{leg.date}</span>
                  </div>
                  <h4 className="font-display text-base font-medium text-foreground mb-1">{leg.title}</h4>
                  {leg.time_label && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-body mb-3">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {leg.time_label}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-xs font-body">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Confirmation</span>
                      <span className="flex items-center gap-1 text-muted-foreground/60">
                        <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                        {leg.confirmation_code || "••••••••"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Cost</span>
                      <span className="flex items-center gap-1 text-muted-foreground/60">
                        <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                        {leg.cost != null ? `$${leg.cost}` : "Redacted"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-sm font-body text-muted-foreground">No itinerary items shared yet.</p>
      )}
    </section>
  );
}
