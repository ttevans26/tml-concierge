import { useState } from "react";
import { ArrowLeft, Globe, Lock, Copy, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

interface Trip {
  id: string;
  name: string;
  destination: string;
  dates: string;
  published: boolean;
  legsCount: number;
  pinsCount: number;
}

const mockTrips: Trip[] = [
  {
    id: "t1",
    name: "Venice & Dolomites",
    destination: "Italy",
    dates: "Sep 1 – 18, 2026",
    published: false,
    legsCount: 3,
    pinsCount: 6,
  },
  {
    id: "t2",
    name: "Nozawaonsen Winter",
    destination: "Japan",
    dates: "Jan 10 – 20, 2026",
    published: false,
    legsCount: 2,
    pinsCount: 4,
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>(mockTrips);

  function togglePublish(id: string) {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, published: !t.published } : t))
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
              Profile
            </h1>
            <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase mt-0.5">
              Social & Sharing
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* User card */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-forest text-primary-foreground flex items-center justify-center text-lg font-body font-semibold">
            TM
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium text-foreground">
              Thomas Mitchell
            </h2>
            <p className="text-sm font-body text-muted-foreground">
              TML Concierge · 2 upcoming trips
            </p>
          </div>
        </div>

        {/* Trip visibility */}
        <section>
          <h3 className="font-display text-lg font-medium text-foreground mb-1">
            Trip Visibility
          </h3>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Published trips share your Pinned Gems and logistics structure with approved friends.
            Confirmation numbers, prices, and points are always redacted.
          </p>

          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className={`border rounded-md p-5 transition-all ${
                  trip.published
                    ? "border-forest/40 bg-forest/[0.03]"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {trip.published ? (
                        <Globe className="w-4 h-4 text-forest" strokeWidth={1.5} />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                      )}
                      <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                        {trip.published ? "Published" : "Private"}
                      </span>
                    </div>

                    <h4 className="font-display text-lg font-medium text-foreground">
                      {trip.name}
                    </h4>
                    <p className="text-sm text-muted-foreground font-body">
                      {trip.destination} · {trip.dates}
                    </p>

                    <div className="flex gap-4 mt-3 text-xs font-body text-muted-foreground">
                      <span>{trip.legsCount} legs</span>
                      <span>{trip.pinsCount} pins</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Switch
                      checked={trip.published}
                      onCheckedChange={() => togglePublish(trip.id)}
                    />
                    <span className="text-[10px] font-body text-muted-foreground">
                      {trip.published ? "Public" : "Private"}
                    </span>
                  </div>
                </div>

                {/* What friends see */}
                {trip.published && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                      <span className="text-[11px] font-body font-medium text-forest uppercase tracking-wider">
                        What friends see
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-body">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3 h-3 text-forest" strokeWidth={1.5} />
                        <span className="text-foreground">Pinned Gems &amp; Map</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3 h-3 text-forest" strokeWidth={1.5} />
                        <span className="text-foreground">Logistics Structure</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <EyeOff className="w-3 h-3 text-destructive" strokeWidth={1.5} />
                        <span className="text-muted-foreground">Confirmations</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <EyeOff className="w-3 h-3 text-destructive" strokeWidth={1.5} />
                        <span className="text-muted-foreground">Prices &amp; Points</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Friends */}
        <section>
          <h3 className="font-display text-lg font-medium text-foreground mb-1">
            Approved Friends
          </h3>
          <p className="text-sm text-muted-foreground font-body mb-6">
            These people can view your published trips
          </p>

          <div className="border border-border rounded-md divide-y divide-border">
            {[
              { name: "Elena Marchetti", initials: "EM", sharedTrips: "Venice & Dolomites" },
            ].map((f) => (
              <div key={f.name} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-body font-medium">
                  {f.initials}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-body font-medium text-foreground">{f.name}</span>
                  <span className="text-xs font-body text-muted-foreground block">
                    Sees: {f.sharedTrips}
                  </span>
                </div>
                <Copy className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
