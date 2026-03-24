import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LOCATION_LISTS } from "./LocationVault";
import type { LocationList } from "./LocationVault";

interface StudioMapProps {
  activeList: LocationList | null;
  minimized?: boolean;
}

function makeIcon(type: string) {
  const colors: Record<string, string> = {
    hotel: "hsl(36,45%,42%)",
    restaurant: "hsl(150,28%,15%)",
    activity: "hsl(220,20%,35%)",
    logistics: "hsl(0,0%,25%)",
  };
  const bg = colors[type] || colors.logistics;
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

// Approximate coords for item locations
const GEOCODE: Record<string, [number, number]> = {
  venice: [45.4408, 12.3155],
  london: [51.5074, -0.1278],
  bath: [51.3811, -2.3590],
  tokyo: [35.6762, 139.6503],
  kagawa: [34.3401, 134.0434],
  italy: [42.5, 12.5],
  europe: [48.0, 10.0],
  greece: [37.98, 23.73],
  france: [46.6, 2.2],
};

function geocode(loc: string): [number, number] {
  const lower = loc.toLowerCase();
  for (const [key, coords] of Object.entries(GEOCODE)) {
    if (lower.includes(key)) return coords;
  }
  let hash = 0;
  for (let i = 0; i < lower.length; i++) hash = (hash * 31 + lower.charCodeAt(i)) & 0x7fffffff;
  return [40 + (hash % 2000) / 200, -5 + ((hash >> 10) % 3000) / 150];
}

export default function StudioMap({ activeList, minimized }: StudioMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [46.0, 10.0],
      zoom: 3,
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

  // Invalidate size on resize
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const timer = setTimeout(() => map.invalidateSize(), 350);
    return () => clearTimeout(timer);
  }, [minimized]);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const bounds: [number, number][] = [];

    if (activeList) {
      // Show only the active list pins
      activeList.items.forEach((item) => {
        const coords = geocode(item.location);
        bounds.push(coords);
        L.marker(coords, { icon: makeIcon(item.type) })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.4">
              <strong>${item.title}</strong><br/>
              <span style="color:#777;font-size:11px">${item.location}</span>
            </div>`
          );
      });
    } else {
      // Show all lists as pins
      LOCATION_LISTS.forEach((list) => {
        if (list.coords) {
          bounds.push(list.coords);
          const marker = L.marker(list.coords, { icon: makeIcon("hotel") })
            .addTo(map)
            .bindPopup(
              `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.4">
                <strong>${list.name}</strong><br/>
                <span style="color:#777;font-size:11px">${list.region} · ${list.items.length} ideas</span>
              </div>`
            );
        }
      });
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [30, 30], maxZoom: 10 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0] as L.LatLngExpression, activeList ? 10 : 6);
    }
  }, [activeList]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
          <h3 className="text-[10px] font-body font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {activeList ? activeList.name : "World Map"}
          </h3>
        </div>
        {minimized && activeList && (
          <p className="text-[9px] font-body text-muted-foreground mt-0.5">
            {activeList.items.length} pins · {activeList.region}
          </p>
        )}
      </div>
      <div ref={containerRef} className="flex-1 z-0" style={{ minHeight: 200 }} />
    </div>
  );
}
