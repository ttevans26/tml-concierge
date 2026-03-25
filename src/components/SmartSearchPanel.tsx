import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, MapPin, Plus, ExternalLink, X, Utensils, Landmark, Link2, Pin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number;
  types: string[];
  mapsUrl: string;
}

interface SavedPlace {
  id: string;
  name: string;
  location: string;
  category?: string;
}

interface SmartSearchPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowType: "dining" | "agenda";
  dayLabel: string;
  dateLabel: string;
  anchorLocation?: string | null;
  savedPlaces?: SavedPlace[];
  onSelect: (result: { title: string; subtitle: string; link?: string; time?: string }) => void;
}

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

// Mock results for demonstration when no API key
const MOCK_RESULTS: Record<string, SearchResult[]> = {
  dining: [
    { placeId: "1", name: "Le Comptoir du Panthéon", address: "5 Rue Soufflot, Paris", rating: 4.3, priceLevel: 2, types: ["restaurant"], mapsUrl: "https://maps.google.com" },
    { placeId: "2", name: "Chez Janou", address: "2 Rue Roger Verlomme, Paris", rating: 4.5, priceLevel: 2, types: ["restaurant"], mapsUrl: "https://maps.google.com" },
    { placeId: "3", name: "La Table de Marius", address: "Place de la République, St-Rémy", rating: 4.7, priceLevel: 3, types: ["restaurant"], mapsUrl: "https://maps.google.com" },
    { placeId: "4", name: "Le Figuier de St-Esprit", address: "8 Rue St-Esprit, Antibes", rating: 4.8, priceLevel: 4, types: ["restaurant"], mapsUrl: "https://maps.google.com" },
  ],
  agenda: [
    { placeId: "5", name: "Musée d'Orsay", address: "1 Rue de la Légion d'Honneur, Paris", rating: 4.7, priceLevel: 2, types: ["museum"], mapsUrl: "https://maps.google.com" },
    { placeId: "6", name: "Les Baux-de-Provence", address: "Les Baux-de-Provence, France", rating: 4.6, priceLevel: 1, types: ["tourist_attraction"], mapsUrl: "https://maps.google.com" },
    { placeId: "7", name: "Pont du Gard", address: "400 Route du Pont du Gard, Vers", rating: 4.7, priceLevel: 2, types: ["tourist_attraction"], mapsUrl: "https://maps.google.com" },
    { placeId: "8", name: "Arena di Verona", address: "Piazza Bra, Verona", rating: 4.6, priceLevel: 2, types: ["tourist_attraction"], mapsUrl: "https://maps.google.com" },
  ],
};

export default function SmartSearchPanel({ open, onOpenChange, rowType, dayLabel, dateLabel, onSelect }: SmartSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualSubtitle, setManualSubtitle] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [manualTime, setManualTime] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const placesDiv = useRef<HTMLDivElement>(null);

  // Initialize Google Places if key available
  useEffect(() => {
    if (!MAPS_KEY || !open) return;

    const w = window as any;
    if (w.google?.maps?.places) {
      autocompleteService.current = new w.google.maps.places.AutocompleteService();
      if (placesDiv.current) {
        placesService.current = new w.google.maps.places.PlacesService(placesDiv.current);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      const gw = window as any;
      autocompleteService.current = new gw.google.maps.places.AutocompleteService();
      if (placesDiv.current) {
        placesService.current = new gw.google.maps.places.PlacesService(placesDiv.current);
      }
    };
    document.head.appendChild(script);
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      setQuery("");
      setResults([]);
      setShowManual(false);
    }
  }, [open]);

  // Search debounce
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (!value.trim()) {
      setResults([]);
      return;
    }

    searchTimeout.current = setTimeout(() => {
      setLoading(true);
      
      if (autocompleteService.current) {
        // Real Google Places search
        const typeFilter = rowType === "dining" ? "restaurant" : "tourist_attraction";
        autocompleteService.current.getPlacePredictions(
          {
            input: value,
            types: [typeFilter === "restaurant" ? "establishment" : "establishment"],
          },
          (predictions: any, status: string) => {
            setLoading(false);
            if (status === "OK" && predictions) {
              setResults(
                predictions.slice(0, 6).map((p) => ({
                  placeId: p.place_id,
                  name: p.structured_formatting.main_text,
                  address: p.structured_formatting.secondary_text || "",
                  types: p.types || [],
                  mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
                }))
              );
            }
          }
        );
      } else {
        // Mock search fallback
        const mockPool = MOCK_RESULTS[rowType] || [];
        const filtered = mockPool.filter(
          (r) => r.name.toLowerCase().includes(value.toLowerCase()) || r.address.toLowerCase().includes(value.toLowerCase())
        );
        setTimeout(() => {
          setResults(filtered.length > 0 ? filtered : mockPool.slice(0, 3));
          setLoading(false);
        }, 300);
      }
    }, 250);
  }, [rowType]);

  const handleSelectResult = (result: SearchResult) => {
    onSelect({
      title: result.name,
      subtitle: result.address,
      link: result.mapsUrl,
    });
    onOpenChange(false);
  };

  const handleManualAdd = () => {
    if (!manualTitle.trim()) return;
    onSelect({
      title: manualTitle.trim(),
      subtitle: manualSubtitle.trim(),
      link: manualLink || undefined,
      time: manualTime || undefined,
    });
    onOpenChange(false);
  };

  const priceDots = (level?: number) => {
    if (!level) return null;
    return (
      <span className="text-[10px] font-body text-primary">
        {"$".repeat(level)}
        <span className="text-muted-foreground/30">{"$".repeat(4 - level)}</span>
      </span>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col p-0 gap-0 border-l border-border">
        {/* Hidden div for PlacesService */}
        <div ref={placesDiv} className="hidden" />

        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            {rowType === "dining" ? (
              <Utensils className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
            ) : (
              <Landmark className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
            )}
            <span className="text-[9px] font-body font-bold uppercase tracking-widest text-primary">
              {rowType === "dining" ? "Find Restaurant" : "Find Activity"}
            </span>
          </div>
          <SheetTitle className="font-display text-lg font-medium tracking-tight text-foreground">
            {dayLabel}
          </SheetTitle>
          <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            {dateLabel} · Smart Search
          </p>
        </SheetHeader>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={rowType === "dining" ? "Search restaurants, cafés, bars…" : "Search museums, landmarks, tours…"}
              className="pl-10 h-10 text-sm font-body bg-muted/30 border-border focus-visible:ring-primary"
            />
          </div>
          {!MAPS_KEY && (
            <p className="text-[9px] font-body text-muted-foreground mt-2 italic">
              Showing sample results — add VITE_GOOGLE_MAPS_KEY for live search
            </p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="px-6 py-8 text-center">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-[10px] font-body text-muted-foreground mt-3 uppercase tracking-widest">Searching…</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="px-4 py-2 space-y-1">
              {results.map((result) => (
                <button
                  key={result.placeId}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-3 py-3 rounded-sm hover:bg-primary/5 transition-colors group border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-body font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {result.name}
                      </p>
                      <p className="text-[10px] font-body text-muted-foreground mt-0.5 truncate">
                        {result.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {result.rating && (
                          <span className="text-[10px] font-body text-primary font-medium">
                            ★ {result.rating}
                          </span>
                        )}
                        {priceDots(result.priceLevel)}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" strokeWidth={1.5} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-xs font-body text-muted-foreground">No results found for "{query}"</p>
              <p className="text-[10px] font-body text-muted-foreground mt-1">Try a different search or add manually below.</p>
            </div>
          )}

          {!loading && !query && (
            <div className="px-6 py-8 text-center">
              <MapPin className="w-6 h-6 text-primary/30 mx-auto mb-2" strokeWidth={1} />
              <p className="text-xs font-body text-muted-foreground">
                Start typing to search for {rowType === "dining" ? "restaurants" : "places"}
              </p>
            </div>
          )}
        </div>

        {/* Manual Add Section */}
        <div className="border-t border-border px-6 py-4 bg-muted/20">
          {!showManual ? (
            <button
              onClick={() => setShowManual(true)}
              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <Link2 className="w-3 h-3" strokeWidth={1.5} />
              Manually Add Link
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                  Manual Entry
                </p>
                <button onClick={() => setShowManual(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </div>
              <div>
                <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">Name</Label>
                <Input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={rowType === "dining" ? "Restaurant name" : "Activity name"}
                  className="h-8 text-sm font-body mt-1"
                  onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">Location</Label>
                  <Input
                    value={manualSubtitle}
                    onChange={(e) => setManualSubtitle(e.target.value)}
                    placeholder="Neighborhood"
                    className="h-8 text-sm font-body mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">Time</Label>
                  <Input
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    placeholder="7:30 PM"
                    className="h-8 text-sm font-body mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">Link</Label>
                <Input
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                  placeholder="Google Maps or website URL"
                  className="h-8 text-sm font-body mt-1"
                />
              </div>
              <button
                onClick={handleManualAdd}
                disabled={!manualTitle.trim()}
                className="w-full flex items-center justify-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-background bg-foreground rounded-sm px-3 py-2 hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3 h-3" strokeWidth={2} />
                Add to {rowType === "dining" ? "Dining" : "Agenda"}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
