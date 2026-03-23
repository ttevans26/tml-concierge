import { useState } from "react";
import { MapPin, Coffee, Dumbbell, Users } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Vibe = "all" | "chill" | "active" | "social";

interface Pin {
  id: string;
  name: string;
  category: string;
  vibe: Exclude<Vibe, "all">;
  lat: number;
  lng: number;
}

const pins: Pin[] = [
  { id: "1", name: "Café Florian", category: "Coffee", vibe: "chill", lat: 45.4341, lng: 12.3388 },
  { id: "2", name: "Lido Beach Club", category: "Beach", vibe: "social", lat: 45.3825, lng: 12.3594 },
  { id: "3", name: "Giardini della Biennale", category: "Walk", vibe: "active", lat: 45.4288, lng: 12.3560 },
  { id: "4", name: "Harry's Bar", category: "Bar", vibe: "social", lat: 45.4318, lng: 12.3356 },
  { id: "5", name: "Yoga on the Roof", category: "Wellness", vibe: "active", lat: 45.4375, lng: 12.3270 },
  { id: "6", name: "Libreria Acqua Alta", category: "Culture", vibe: "chill", lat: 45.4380, lng: 12.3430 },
];

const vibeFilters: { key: Vibe; label: string; icon: typeof Coffee }[] = [
  { key: "all", label: "All", icon: MapPin },
  { key: "chill", label: "Chill", icon: Coffee },
  { key: "active", label: "Active", icon: Dumbbell },
  { key: "social", label: "Social", icon: Users },
];

// Custom marker icon using forest green
const defaultIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50%;background:hsl(150,28%,15%);border:2px solid hsl(150,28%,15%);display:flex;align-items:center;justify-content:center;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(43,33%,98%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const selectedIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:34px;height:34px;border-radius:50%;background:hsl(150,28%,15%);border:3px solid hsl(43,33%,98%);box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(43,33%,98%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

function FlyToPin({ pin }: { pin: Pin | null }) {
  const map = useMap();
  if (pin) {
    map.flyTo([pin.lat, pin.lng], 15, { duration: 0.8 });
  }
  return null;
}

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
      <div className="flex flex-col lg:flex-row border border-border rounded-md overflow-hidden">
        {/* Real Map */}
        <div className="relative lg:w-3/5 h-72 lg:h-96 z-0">
          <MapContainer
            center={[45.4340, 12.3388]}
            zoom={13}
            className="h-full w-full"
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            />
            {filtered.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={selectedPin?.id === pin.id ? selectedIcon : defaultIcon}
                eventHandlers={{ click: () => setSelectedPin(pin) }}
              >
                <Popup>
                  <div className="font-body text-sm">
                    <strong className="text-foreground">{pin.name}</strong>
                    <br />
                    <span className="text-muted-foreground text-xs">{pin.category} · {pin.vibe}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
            <FlyToPin pin={selectedPin} />
          </MapContainer>
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
