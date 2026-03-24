import { useState } from "react";
import { MapPin, Hotel, Utensils, Compass, ChevronDown, ChevronRight, Sparkles, Lightbulb } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface VaultItem {
  id: string;
  type: "hotel" | "restaurant" | "activity" | "logistics";
  title: string;
  subtitle: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  imageUrl?: string;
  location: string;
}

export interface LocationList {
  id: string;
  name: string;
  region: string;
  items: VaultItem[];
  coords?: [number, number];
}

const LOCATION_LISTS: LocationList[] = [
  {
    id: "list-venice",
    name: "Venice Highlights",
    region: "Veneto, Italy",
    coords: [45.4408, 12.3155],
    items: [
      { id: "v1", type: "hotel", title: "The Gritti Palace", subtitle: "A Luxury Collection Hotel", rating: 4.7, reviewCount: 1842, priceLevel: 4, imageUrl: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&h=250&fit=crop", location: "Venice" },
      { id: "v2", type: "restaurant", title: "Ristorante Quadri", subtitle: "Alajmo Group · St. Mark's Square", rating: 4.5, reviewCount: 3210, priceLevel: 4, imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop", location: "Venice" },
      { id: "v3", type: "activity", title: "Peggy Guggenheim Collection", subtitle: "Modern art on the Grand Canal", rating: 4.6, reviewCount: 12450, imageUrl: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=400&h=250&fit=crop", location: "Venice" },
      { id: "v4", type: "activity", title: "Burano Island Day Trip", subtitle: "Colorful fishing village · Lace-making", rating: 4.8, reviewCount: 8320, imageUrl: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400&h=250&fit=crop", location: "Venice" },
      { id: "v5", type: "restaurant", title: "Osteria Alle Testiere", subtitle: "Intimate seafood · 9 tables only", rating: 4.4, reviewCount: 967, priceLevel: 3, imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=250&fit=crop", location: "Venice" },
    ],
  },
  {
    id: "list-london",
    name: "London Essentials",
    region: "England, UK",
    coords: [51.5074, -0.1278],
    items: [
      { id: "l1", type: "hotel", title: "The Connaught", subtitle: "Maybourne Group · Mayfair", rating: 4.8, reviewCount: 2105, priceLevel: 4, imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=250&fit=crop", location: "London" },
      { id: "l2", type: "restaurant", title: "The River Café", subtitle: "Thames Wharf · Italian", rating: 4.4, reviewCount: 4530, priceLevel: 3, imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop", location: "London" },
      { id: "l3", type: "activity", title: "Tate Modern — Turbine Hall", subtitle: "Free admission · Bankside", rating: 4.6, reviewCount: 67200, imageUrl: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=400&h=250&fit=crop", location: "London" },
    ],
  },
  {
    id: "list-bath",
    name: "Bath & Cotswolds",
    region: "Somerset, England",
    coords: [51.3811, -2.3590],
    items: [
      { id: "b1", type: "hotel", title: "The Gainsborough Bath Spa", subtitle: "YTL Hotels · Natural thermal spa", rating: 4.6, reviewCount: 1530, priceLevel: 3, imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop", location: "Bath" },
      { id: "b2", type: "activity", title: "Roman Baths & Pump Room", subtitle: "UNESCO Heritage · City centre", rating: 4.7, reviewCount: 28400, imageUrl: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=400&h=250&fit=crop", location: "Bath" },
    ],
  },
  {
    id: "list-tokyo",
    name: "Tokyo Gems",
    region: "Kantō, Japan",
    coords: [35.6762, 139.6503],
    items: [
      { id: "t1", type: "hotel", title: "Aman Tokyo", subtitle: "Otemachi Tower · Minimalist luxury", rating: 4.8, reviewCount: 1205, imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop", location: "Tokyo" },
      { id: "t2", type: "restaurant", title: "Sukiyabashi Jiro", subtitle: "Ginza · Omakase sushi", rating: 4.3, reviewCount: 2840, imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=250&fit=crop", location: "Tokyo" },
      { id: "t3", type: "activity", title: "Naoshima Art Island", subtitle: "Tadao Ando museums · Benesse House", rating: 4.7, reviewCount: 5610, imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop", location: "Kagawa" },
    ],
  },
];

const JUNK_DRAWER: VaultItem[] = [
  { id: "j1", type: "activity", title: "Learn to make fresh pasta", subtitle: "Cooking class · Tuscany region", location: "Italy" },
  { id: "j2", type: "logistics", title: "Eurostar vs. Flying for London→Paris", subtitle: "Compare travel time & cost", location: "Europe" },
  { id: "j3", type: "hotel", title: "That rooftop pool hotel from Instagram", subtitle: "Need to find the name — was in Santorini?", location: "Greece" },
  { id: "j4", type: "restaurant", title: "Michelin 3-star blind tasting", subtitle: "Somewhere in France — bucket list", location: "France" },
];

const typeIcon = { hotel: Hotel, restaurant: Utensils, activity: Compass, logistics: MapPin };

interface LocationVaultProps {
  activeListId: string | null;
  onSelectList: (list: LocationList | null) => void;
}

export default function LocationVault({ activeListId, onSelectList }: LocationVaultProps) {
  const [junkOpen, setJunkOpen] = useState(false);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-5 pt-6 pb-4 border-b border-border">
        <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
          Ideas Vault
        </h2>
        <p className="text-[10px] font-body text-muted-foreground tracking-widest uppercase mt-1">
          Select a list to explore · Drag to trip
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Location-Specific Lists */}
        <div className="px-3 py-3 space-y-1">
          <span className="px-2 text-[9px] font-body font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Destinations
          </span>
          {LOCATION_LISTS.map((list) => {
            const isActive = activeListId === list.id;
            return (
              <button
                key={list.id}
                onClick={() => onSelectList(isActive ? null : list)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left transition-all group ${
                  isActive
                    ? "bg-forest/10 border border-forest/20"
                    : "hover:bg-secondary/60 border border-transparent"
                }`}
              >
                <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${
                  isActive ? "bg-forest text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`block text-[12px] font-body font-medium truncate ${
                    isActive ? "text-forest" : "text-foreground"
                  }`}>
                    {list.name}
                  </span>
                  <span className="block text-[9px] font-body text-muted-foreground truncate">
                    {list.region} · {list.items.length} ideas
                  </span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-forest shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Junk Drawer */}
        <div className="border-t border-border">
          <Collapsible open={junkOpen} onOpenChange={setJunkOpen}>
            <CollapsibleTrigger className="w-full flex items-center gap-2 px-5 py-3 hover:bg-secondary/50 transition-colors">
              {junkOpen ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
              )}
              <Lightbulb className="w-3 h-3 text-warm-gray" strokeWidth={1.5} />
              <span className="text-[10px] font-body font-semibold uppercase tracking-widest text-foreground">
                Random Interests & Inspiration
              </span>
              <span className="ml-auto text-[9px] font-body font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                {JUNK_DRAWER.length}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-3 space-y-1.5">
                {JUNK_DRAWER.map((item) => {
                  const Icon = typeIcon[item.type];
                  return (
                    <div
                      key={item.id}
                      draggable
                      className="flex items-start gap-2.5 p-2.5 rounded-sm border border-border bg-background hover:border-forest/30 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
                    >
                      <Icon className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-body font-medium text-foreground leading-snug truncate">
                          {item.title}
                        </p>
                        <p className="text-[9px] font-body text-muted-foreground leading-relaxed truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

export { LOCATION_LISTS };
export type { LocationList as LocationListType };
