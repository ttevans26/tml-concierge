import { useState } from "react";
import { MapPin, Coffee, Dumbbell, Users } from "lucide-react";

type Vibe = "all" | "chill" | "active" | "social";

interface Pin {
  id: string;
  name: string;
  category: string;
  vibe: Exclude<Vibe, "all">;
  x: number; // % position on mock map
  y: number;
}

const pins: Pin[] = [
  { id: "1", name: "Café Florian", category: "Coffee", vibe: "chill", x: 32, y: 45 },
  { id: "2", name: "Lido Beach Club", category: "Beach", vibe: "social", x: 68, y: 30 },
  { id: "3", name: "Giardini Trail", category: "Hike", vibe: "active", x: 55, y: 65 },
  { id: "4", name: "Harry's Bar", category: "Bar", vibe: "social", x: 25, y: 60 },
  { id: "5", name: "Yoga on the Roof", category: "Wellness", vibe: "active", x: 45, y: 25 },
  { id: "6", name: "Libreria Acqua Alta", category: "Culture", vibe: "chill", x: 72, y: 55 },
];

const vibeFilters: { key: Vibe; label: string; icon: typeof Coffee }[] = [
  { key: "all", label: "All", icon: MapPin },
  { key: "chill", label: "Chill", icon: Coffee },
  { key: "active", label: "Active", icon: Dumbbell },
  { key: "social", label: "Social", icon: Users },
];

export default function QuickHitsMap() {
  const [activeVibe, setActiveVibe] = useState<Vibe>("all");
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const filtered = activeVibe === "all" ? pins : pins.filter((p) => p.vibe === activeVibe);

  return (
    <section className="w-full">
      <h2 className="font-display text-2xl font-medium tracking-tight text-foreground mb-1">
        Pinned Gems
      </h2>
      <p className="text-sm text-muted-foreground font-body mb-6">
        Curated spots near your next destination
      </p>

      {/* Vibe Filter */}
      <div className="flex gap-2 mb-6">
        {vibeFilters.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveVibe(key); setSelectedPin(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body font-medium tracking-wide transition-all border ${
              activeVibe === key
                ? "bg-forest text-primary-foreground border-forest"
                : "bg-background text-muted-foreground border-border hover:border-forest/40"
            }`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* Split view */}
      <div className="flex flex-col lg:flex-row gap-4 border border-border rounded-md overflow-hidden">
        {/* Mock Map */}
        <div className="relative lg:w-3/5 h-72 lg:h-96 bg-secondary">
          {/* Grid pattern to suggest a map */}
          <div className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm border border-border rounded px-2.5 py-1 text-[10px] font-body text-muted-foreground tracking-wide uppercase">
            Venice, Italy
          </div>

          {filtered.map((pin) => (
            <button
              key={pin.id}
              onClick={() => setSelectedPin(pin)}
              className={`absolute transition-all duration-200 ${selectedPin?.id === pin.id ? "scale-125 z-10" : "hover:scale-110"}`}
              style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                selectedPin?.id === pin.id
                  ? "bg-forest border-forest text-primary-foreground"
                  : "bg-background border-border text-forest"
              }`}>
                <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
            </button>
          ))}
        </div>

        {/* Pin List */}
        <div className="lg:w-2/5 p-4 space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((pin) => (
            <button
              key={pin.id}
              onClick={() => setSelectedPin(pin)}
              className={`w-full text-left p-3 rounded border transition-all ${
                selectedPin?.id === pin.id
                  ? "border-forest bg-forest/5"
                  : "border-transparent hover:bg-secondary"
              }`}
            >
              <span className="text-sm font-body font-medium text-foreground block">{pin.name}</span>
              <span className="text-xs font-body text-muted-foreground">{pin.category} · {pin.vibe}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground font-body py-8 text-center">No pins for this vibe</p>
          )}
        </div>
      </div>
    </section>
  );
}
