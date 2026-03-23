import { useState } from "react";
import { Plane, Car, Hotel, MapPin, Copy, EyeOff, Check } from "lucide-react";

interface SharedLeg {
  id: string;
  type: "flight" | "transit" | "stay";
  title: string;
  subtitle: string;
  date: string;
}

interface SharedPin {
  id: string;
  name: string;
  category: string;
  vibe: string;
}

const sharedLegs: SharedLeg[] = [
  { id: "s1", type: "stay", title: "Ryokan Sakaya — Nozawaonsen", subtitle: "Traditional hot spring ryokan, half-board", date: "Jan 12 – 15, 2026" },
  { id: "s2", type: "transit", title: "Hertz — Venice Airport (VCE)", subtitle: "Full-size SUV, GPS included", date: "Sep 6, 2026" },
  { id: "s3", type: "flight", title: "Delta DL-178 — MXP → LAX", subtitle: "Delta One Suite, Award Booking", date: "Sep 17, 2026" },
];

const sharedPins: SharedPin[] = [
  { id: "p1", name: "Café Florian", category: "Coffee", vibe: "Chill" },
  { id: "p2", name: "Lido Beach Club", category: "Beach", vibe: "Social" },
  { id: "p3", name: "Giardini della Biennale", category: "Walk", vibe: "Active" },
  { id: "p4", name: "Harry's Bar", category: "Bar", vibe: "Social" },
];

const iconMap = { flight: Plane, transit: Car, stay: Hotel };

export default function SharedTripView() {
  const [cloned, setCloned] = useState(false);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
          Shared Trip
        </h2>
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground border border-border rounded-full px-3 py-1">
          From Thomas M.
        </span>
      </div>
      <p className="text-sm text-muted-foreground font-body mb-8">
        Venice &amp; Dolomites · Italy · Sep 2026
      </p>

      {/* Clone button */}
      <div className="mb-8">
        <button
          onClick={() => setCloned(true)}
          disabled={cloned}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all ${
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

      {/* Shared Legs — redacted */}
      <div className="mb-10">
        <h3 className="font-display text-lg font-medium text-foreground mb-4">
          Logistics Structure
        </h3>
        <div className="space-y-3">
          {sharedLegs.map((leg) => {
            const Icon = iconMap[leg.type];
            return (
              <div key={leg.id} className="border border-border rounded-md p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <Icon className="w-4 h-4 text-forest" strokeWidth={1.5} />
                  <span className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                    {leg.type === "transit" ? "Rental" : leg.type}
                  </span>
                  <span className="text-xs font-body text-muted-foreground ml-auto">
                    {leg.date}
                  </span>
                </div>
                <h4 className="font-display text-base font-medium text-foreground mb-1">
                  {leg.title}
                </h4>
                <p className="text-sm text-muted-foreground font-body mb-4">{leg.subtitle}</p>

                {/* Redacted fields */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-body">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Confirmation</span>
                    <span className="flex items-center gap-1 text-muted-foreground/60">
                      <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                      ••••••••
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Points Used</span>
                    <span className="flex items-center gap-1 text-muted-foreground/60">
                      <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                      Redacted
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Payment</span>
                    <span className="flex items-center gap-1 text-muted-foreground/60">
                      <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                      Redacted
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shared Pins */}
      <div>
        <h3 className="font-display text-lg font-medium text-foreground mb-4">
          Pinned Gems
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sharedPins.map((pin) => (
            <div key={pin.id} className="border border-border rounded-md p-4 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-forest mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <span className="text-sm font-body font-medium text-foreground block">
                  {pin.name}
                </span>
                <span className="text-xs font-body text-muted-foreground">
                  {pin.category} · {pin.vibe}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
