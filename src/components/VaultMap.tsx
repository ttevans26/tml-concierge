import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { IdeaCard } from "./IdeasVault";

interface VaultMapProps {
  ideas: IdeaCard[];
  onPinClick?: (idea: IdeaCard) => void;
}

// Geocode lookup — approximate coords for common destinations
const GEOCODE_CACHE: Record<string, [number, number]> = {
  "bath": [51.3811, -2.3590],
  "london": [51.5074, -0.1278],
  "mayfair": [51.5074, -0.1478],
  "venice": [45.4408, 12.3155],
  "tokyo": [35.6762, 139.6503],
  "mexico city": [19.4326, -99.1332],
  "japan": [36.2048, 138.2529],
  "kagawa": [34.3401, 134.0434],
  "lake garda": [45.6380, 10.7108],
  "gardone": [45.6220, 10.5550],
  "como": [45.8080, 9.0852],
  "lake como": [45.9936, 9.2572],
  "provence": [43.9493, 6.0679],
  "paris": [48.8566, 2.3522],
  "verona": [45.4384, 10.9916],
  "dolomites": [46.4102, 11.8440],
  "antibes": [43.5808, 7.1239],
  "stresa": [45.8843, 8.5330],
  "sherborne": [50.9468, -2.5167],
  "florence": [43.7696, 11.2558],
  "rome": [41.9028, 12.4964],
  "naples": [40.8518, 14.2681],
  "amalfi": [40.6340, 14.6027],
  "barcelona": [41.3874, 2.1686],
  "lisbon": [38.7223, -9.1393],
  "amsterdam": [52.3676, 4.9041],
  "berlin": [52.5200, 13.4050],
  "munich": [48.1351, 11.5820],
  "vienna": [48.2082, 16.3738],
  "zurich": [47.3769, 8.5417],
  "copenhagen": [55.6761, 12.5683],
  "oslo": [59.9139, 10.7522],
  "istanbul": [41.0082, 28.9784],
  "athens": [37.9838, 23.7275],
  "dubrovnik": [42.6507, 18.0944],
  "burano": [45.4854, 12.4167],
  "st-rémy": [43.7892, 4.8313],
  "avignon": [43.9493, 4.8055],
  "nice": [43.7102, 7.2620],
};

function geocode(location: string): [number, number] | null {
  const lower = location.toLowerCase();
  for (const [key, coords] of Object.entries(GEOCODE_CACHE)) {
    if (lower.includes(key)) return coords;
  }
  // Hash-based pseudo-random position as fallback (centered on Europe)
  let hash = 0;
  for (let i = 0; i < lower.length; i++) hash = (hash * 31 + lower.charCodeAt(i)) & 0x7fffffff;
  const lat = 40 + (hash % 2000) / 200;
  const lng = -5 + ((hash >> 10) % 3000) / 150;
  return [lat, lng];
}

function makeIcon(type: string) {
  const colors: Record<string, string> = {
    hotel: "hsl(36,45%,42%)",
    restaurant: "hsl(150,28%,15%)",
    site: "hsl(0,0%,25%)",
  };
  const bg = colors[type] || colors.site;
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${bg};border:2px solid hsl(43,33%,98%);box-shadow:0 1px 4px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(43,33%,98%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

export default function VaultMap({ ideas, onPinClick }: VaultMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [46.0, 10.0],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png").addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers with ideas
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const bounds: [number, number][] = [];

    ideas.forEach((idea) => {
      const coords = geocode(idea.location);
      if (!coords) return;
      bounds.push(coords);

      const marker = L.marker(coords, { icon: makeIcon(idea.type) })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.4">
            <strong>${idea.title}</strong><br/>
            <span style="color:#777;font-size:11px">${idea.location}</span>
          </div>`
        )
        .on("click", () => onPinClick?.(idea));
      markersRef.current.set(idea.id, marker);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [30, 30], maxZoom: 10 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0] as L.LatLngExpression, 8);
    }
  }, [ideas, onPinClick]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-6 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
          <h3 className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
            Vault Map
          </h3>
          <span className="ml-auto text-[9px] font-body font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
            {ideas.length} pins
          </span>
        </div>
        <p className="text-[9px] font-body text-muted-foreground">
          All vault ideas plotted geographically
        </p>
      </div>
      <div ref={mapContainerRef} className="flex-1 z-0" style={{ minHeight: 200 }} />
    </div>
  );
}
