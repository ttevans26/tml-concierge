import { useState } from "react";
import { Plane, Car, Hotel, MapPin, Utensils, Copy, EyeOff, Check, Clock } from "lucide-react";

interface SharedLeg {
  id: string;
  type: "flight" | "transit" | "stay" | "dining";
  title: string;
  subtitle: string;
  date: string;
  time?: string;
  thomasTake?: string;
}

interface SharedPin {
  id: string;
  name: string;
  category: string;
  vibe: string;
}

const sharedLegs: SharedLeg[] = [
  { id: "s1", type: "stay", title: "Queens Arms", subtitle: "Sherborne, Dorset", date: "Aug 21, 2026", thomasTake: "Charming village pub with rooms. Perfect jet-lag recovery stop." },
  { id: "s2", type: "stay", title: "Roseate Villa", subtitle: "Bath · Garden Suite", date: "Aug 22–23, 2026", thomasTake: "Best boutique in Bath. Request the garden-facing room." },
  { id: "s3", type: "stay", title: "Hotel L'Ormaie", subtitle: "Paris · Saint-Germain", date: "Aug 24–26, 2026", thomasTake: "Intimate Parisian gem. Book via Amex FHR for the $200 dining credit." },
  { id: "s4", type: "stay", title: "Hotel Sous les Figuiers", subtitle: "St-Rémy-de-Provence", date: "Aug 27–30, 2026", thomasTake: "Under-target pricing makes this the budget hero of the trip." },
  { id: "s5", type: "stay", title: "La Villa Port d'Antibes", subtitle: "Antibes · Sea View", date: "Aug 31 – Sep 1, 2026" },
  { id: "s6", type: "stay", title: "Hotel Accademia", subtitle: "Verona · Centro Storico", date: "Sep 2–4, 2026" },
  { id: "s7", type: "stay", title: "Adler Spa Resort", subtitle: "Dolomites · Spa & Wellness", date: "Sep 5–9, 2026", thomasTake: "The splurge stay. 5 nights of half-board, spa, and alpine air." },
  { id: "s8", type: "stay", title: "Hotel Bella Riva", subtitle: "Garda · Lakefront", date: "Sep 10–13, 2026", thomasTake: "Sauna right on the lake. Book the terrace room." },
  { id: "s9", type: "stay", title: "Sempione Boutique Hotel", subtitle: "Arona, Lake Maggiore", date: "Sep 14–16, 2026" },
  { id: "l1", type: "transit", title: "TGV Paris → Avignon", subtitle: "1st Class · Gare de Lyon", date: "Aug 24, 2026", time: "8:12 AM → 11:00 AM" },
  { id: "l2", type: "transit", title: "Train Avignon → Nice", subtitle: "TER Regional", date: "Aug 28, 2026", time: "9:30 AM → 1:15 PM" },
  { id: "l3", type: "flight", title: "Flight NCE → VCE", subtitle: "easyJet · EZY4519", date: "Sep 2, 2026", time: "2:30 PM → 4:00 PM" },
];

const sharedPins: SharedPin[] = [
  { id: "p1", name: "Le Comptoir du Panthéon", category: "Dining", vibe: "Classic" },
  { id: "p2", name: "La Table de Marius", category: "Dining", vibe: "Provençal" },
  { id: "p3", name: "Le Figuier de St-Esprit", category: "Dining", vibe: "Michelin" },
  { id: "p4", name: "Ristorante Lido 84", category: "Dining", vibe: "Lakeside" },
  { id: "p5", name: "Les Baux-de-Provence", category: "Day Trip", vibe: "Historic" },
  { id: "p6", name: "Pont du Gard", category: "Day Trip", vibe: "Ancient" },
  { id: "p7", name: "Borromean Islands", category: "Excursion", vibe: "Scenic" },
];

const iconMap = { flight: Plane, transit: Car, stay: Hotel, dining: Utensils };

export default function SharedTripView() {
  const [cloned, setCloned] = useState(false);

  const stays = sharedLegs.filter((l) => l.type === "stay");
  const logistics = sharedLegs.filter((l) => l.type === "transit" || l.type === "flight");

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
          Europe Grand Tour
        </h2>
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground border border-border rounded-full px-3 py-1">
          From Thomas M.
        </span>
      </div>
      <p className="text-sm text-muted-foreground font-body mb-8">
        Aug 21 – Sep 17, 2026 · 28 Days · 9 Stays
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
      <div className="mb-10">
        <h3 className="font-display text-lg font-medium text-foreground mb-4">
          Hotels & Stays
        </h3>
        <div className="space-y-3">
          {stays.map((leg) => {
            const Icon = iconMap[leg.type];
            return (
              <div key={leg.id} className="border border-border rounded-md p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <Icon className="w-4 h-4 text-forest" strokeWidth={1.5} />
                  <span className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                    Stay
                  </span>
                  <span className="text-xs font-body text-muted-foreground ml-auto">
                    {leg.date}
                  </span>
                </div>
                <h4 className="font-display text-base font-medium text-foreground mb-1">
                  {leg.title}
                </h4>
                <p className="text-sm text-muted-foreground font-body mb-3">{leg.subtitle}</p>

                {/* Thomas's Take (visible in shared view) */}
                {leg.thomasTake && (
                  <p className="text-xs font-body text-foreground italic border-l-2 border-forest/30 pl-3 mb-3">
                    "{leg.thomasTake}"
                  </p>
                )}

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
                    <span className="text-muted-foreground block mb-0.5">Price</span>
                    <span className="flex items-center gap-1 text-muted-foreground/60">
                      <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                      Redacted
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Points</span>
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

      {/* Logistics — simplified (times visible, costs redacted) */}
      <div className="mb-10">
        <h3 className="font-display text-lg font-medium text-foreground mb-4">
          Logistics Structure
        </h3>
        <div className="space-y-3">
          {logistics.map((leg) => {
            const Icon = iconMap[leg.type];
            return (
              <div key={leg.id} className="border border-border rounded-md p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <Icon className="w-4 h-4 text-forest" strokeWidth={1.5} />
                  <span className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                    {leg.type === "transit" ? "Train" : "Flight"}
                  </span>
                  <span className="text-xs font-body text-muted-foreground ml-auto">
                    {leg.date}
                  </span>
                </div>
                <h4 className="font-display text-base font-medium text-foreground mb-1">
                  {leg.title}
                </h4>
                {leg.time && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-body mb-3">
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {leg.time}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-xs font-body">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Confirmation</span>
                    <span className="flex items-center gap-1 text-muted-foreground/60">
                      <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                      ••••••••
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Cost</span>
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

      {/* Pinned Gems */}
      <div>
        <h3 className="font-display text-lg font-medium text-foreground mb-4">
          Thomas's Vetted Gems
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
