import { useState, useEffect } from "react";
import { Sparkles, Plane, Hotel, Utensils, MapPin, AlertTriangle, Clock, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface ParsedItem {
  type: "flight" | "stay" | "dining" | "site" | "transit";
  title: string;
  subtitle: string;
  time?: string;
  location?: string;
  cancellationDate?: string;
  cancellationLabel?: string;
  pointsAdvice?: string;
  nearbyTip?: string;
  hasConflict?: boolean;
  conflictReason?: string;
}

export interface IngestorResult {
  items: ParsedItem[];
  summary: string;
}

// Mock parsing engine
function analyzeInput(input: string): IngestorResult {
  const items: ParsedItem[] = [];
  const lower = input.toLowerCase();

  // Detect flight numbers
  const flightMatch = input.match(/\b([A-Z]{2})\s?(\d{2,4})\b/i);
  if (flightMatch || lower.includes("flight") || lower.includes("delta") || lower.includes("united") || lower.includes("british")) {
    const code = flightMatch ? `${flightMatch[1].toUpperCase()}${flightMatch[2]}` : "DL456";
    const airlines: Record<string, string> = { DL: "Delta", UA: "United", BA: "British Airways", AA: "American" };
    const prefix = code.slice(0, 2);
    items.push({
      type: "flight",
      title: `${airlines[prefix] || prefix} ${code}`,
      subtitle: "Auto-detected flight number",
      time: "Departure TBD",
      location: "International",
      pointsAdvice: "Best Card: Amex Platinum (5x Points)",
    });
  }

  // Detect hotels
  const hotelKeywords = ["hotel", "resort", "inn", "lodge", "ryokan", "palazzo", "villa", "gainsborough", "connaught", "danieli", "bella riva", "accademia"];
  for (const kw of hotelKeywords) {
    if (lower.includes(kw)) {
      const hotelName = input.match(new RegExp(`([\\w\\s'-]+${kw}[\\w\\s'-]*)`, "i"))?.[1]?.trim() || `Hotel (${kw})`;
      items.push({
        type: "stay",
        title: hotelName.length > 40 ? hotelName.slice(0, 40) + "…" : hotelName,
        subtitle: "Extracted from input",
        location: extractLocation(input),
        pointsAdvice: "Best Card: Chase Sapphire Reserve (3x Points)",
      });
      break;
    }
  }

  // Detect restaurants/dining
  const diningKeywords = ["restaurant", "ristorante", "trattoria", "bistro", "bar", "café", "cafe", "dinner", "reservation", "harry's", "quadri"];
  for (const kw of diningKeywords) {
    if (lower.includes(kw)) {
      const name = input.match(new RegExp(`([\\w\\s'-]*${kw}[\\w\\s'-]*)`, "i"))?.[1]?.trim() || `Dining (${kw})`;
      items.push({
        type: "dining",
        title: name.length > 40 ? name.slice(0, 40) + "…" : name,
        subtitle: "Dining reservation detected",
        location: extractLocation(input),
        pointsAdvice: "Best Card: Chase Sapphire Reserve (3x Dining)",
        nearbyTip: lower.includes("venice") || lower.includes("marco") ? "Nearby: Peggy Guggenheim Collection is 5 mins away" : undefined,
      });
      break;
    }
  }

  // Detect sites/activities
  const siteKeywords = ["museum", "gallery", "collection", "tour", "cathedral", "basilica", "palace", "garden", "guggenheim", "murano"];
  for (const kw of siteKeywords) {
    if (lower.includes(kw)) {
      const name = input.match(new RegExp(`([\\w\\s'-]*${kw}[\\w\\s'-]*)`, "i"))?.[1]?.trim() || `Site (${kw})`;
      items.push({
        type: "site",
        title: name.length > 40 ? name.slice(0, 40) + "…" : name,
        subtitle: "Point of interest detected",
        location: extractLocation(input),
        nearbyTip: lower.includes("venice") ? "Nearby: Harry's Bar is 5 mins away" : undefined,
      });
      break;
    }
  }

  // Detect cancellation deadlines
  const cancelMatch = input.match(/cancel\s*(?:by|before|until)\s+(\w+\s+\d{1,2}(?:,?\s*\d{4})?)/i);
  if (cancelMatch) {
    const dateStr = cancelMatch[1];
    items.forEach((item) => {
      item.cancellationDate = dateStr;
      item.cancellationLabel = dateStr;
    });
  }

  // Detect URLs
  const urlMatch = input.match(/https?:\/\/[^\s]+/);
  if (urlMatch && items.length === 0) {
    const url = urlMatch[0].toLowerCase();
    if (url.includes("booking") || url.includes("hotels")) {
      items.push({ type: "stay", title: "Hotel from Link", subtitle: urlMatch[0], location: "TBD", pointsAdvice: "Best Card: Chase Sapphire Reserve (3x Points)" });
    } else if (url.includes("opentable") || url.includes("resy")) {
      items.push({ type: "dining", title: "Restaurant from Link", subtitle: urlMatch[0], location: "TBD", pointsAdvice: "Best Card: Chase Sapphire Reserve (3x Dining)" });
    } else {
      items.push({ type: "site", title: "Discovered from Link", subtitle: urlMatch[0], location: "TBD" });
    }
  }

  // Fallback
  if (items.length === 0 && input.trim().length > 5) {
    items.push({ type: "site", title: input.trim().slice(0, 50), subtitle: "Added from raw text", location: "Unknown" });
  }

  // Check conflicts — if two items are in different cities
  const locations = items.map((i) => i.location).filter(Boolean);
  const uniqueLocations = [...new Set(locations.map((l) => l?.toLowerCase()))];
  if (uniqueLocations.length > 1) {
    items.forEach((item) => {
      item.hasConflict = true;
      item.conflictReason = `Geographic conflict: ${uniqueLocations.join(" vs ")} on the same day`;
    });
  }

  // Build summary
  const counts: Record<string, number> = {};
  items.forEach((i) => { counts[i.type] = (counts[i.type] || 0) + 1; });
  const parts: string[] = [];
  if (counts.flight) parts.push(`${counts.flight} Flight${counts.flight > 1 ? "s" : ""}`);
  if (counts.stay) parts.push(`${counts.stay} Hotel${counts.stay > 1 ? "s" : ""}`);
  if (counts.dining) parts.push(`${counts.dining} Dining Pin${counts.dining > 1 ? "s" : ""}`);
  if (counts.site) parts.push(`${counts.site} Site${counts.site > 1 ? "s" : ""}`);
  if (counts.transit) parts.push(`${counts.transit} Transit`);
  const deadlineCount = items.filter((i) => i.cancellationDate).length;
  if (deadlineCount) parts.push(`${deadlineCount} Cancellation Deadline${deadlineCount > 1 ? "s" : ""}`);

  return {
    items,
    summary: parts.length > 0 ? `I've identified ${parts.join(", ")}. Confirm to Timeline?` : "No items detected.",
  };
}

function extractLocation(text: string): string {
  const cities = ["venice", "rome", "florence", "london", "paris", "tokyo", "verona", "bath", "como", "garda", "provence", "milan"];
  const lower = text.toLowerCase();
  for (const city of cities) {
    if (lower.includes(city)) return city.charAt(0).toUpperCase() + city.slice(1);
  }
  return "Unknown";
}

const typeIcons = { flight: Plane, stay: Hotel, dining: Utensils, site: MapPin, transit: Plane };
const typeLabels = { flight: "Flight", stay: "Hotel", dining: "Dining", site: "Site", transit: "Transit" };

interface IntelligenceIngestorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: IngestorResult) => void;
}

export default function IntelligenceIngestor({ open, onOpenChange, onConfirm }: IntelligenceIngestorProps) {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"input" | "analyzing" | "review">("input");
  const [result, setResult] = useState<IngestorResult | null>(null);
  const [dots, setDots] = useState(0);

  // Animated dots during analysis
  useEffect(() => {
    if (phase !== "analyzing") return;
    const interval = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(interval);
  }, [phase]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    setPhase("analyzing");

    setTimeout(() => {
      const parsed = analyzeInput(input);
      setResult(parsed);
      setPhase("review");
    }, 1800);
  };

  const handleConfirm = () => {
    if (result) {
      onConfirm(result);
      handleClose();
    }
  };

  const handleClose = () => {
    setInput("");
    setPhase("input");
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-forest" strokeWidth={1.5} />
            TML Intelligence Ingestor
          </DialogTitle>
          <DialogDescription className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            Paste a URL, flight number, or raw text
          </DialogDescription>
        </DialogHeader>

        {phase === "input" && (
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder={"Paste anything here…\n\nExamples:\n• DL456 on Sep 6\n• Dinner at Harry's Bar, Venice, 8PM. Cancel by Aug 15\n• https://booking.com/hotel-danieli\n• Peggy Guggenheim Collection, morning tour"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="font-body text-sm min-h-[140px] resize-none"
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="w-full bg-forest text-primary-foreground hover:bg-forest/90 font-body text-xs tracking-wider uppercase h-10"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
              Analyze & Parse
            </Button>
          </div>
        )}

        {phase === "analyzing" && (
          <div className="py-12 flex flex-col items-center gap-4 animate-fade-in">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-forest/20 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-forest animate-spin" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-forest flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={2} />
              </div>
            </div>
            <div className="text-center">
              <p className="font-display text-base font-medium text-foreground">
                Analyzing{".".repeat(dots)}
              </p>
              <p className="text-[11px] font-body text-muted-foreground mt-1">
                Extracting flights, hotels, deadlines & geography
              </p>
            </div>
          </div>
        )}

        {phase === "review" && result && (
          <div className="space-y-4 pt-2 animate-fade-in">
            {/* Parsed items */}
            <div className="space-y-2">
              {result.items.map((item, i) => {
                const Icon = typeIcons[item.type];
                return (
                  <div
                    key={i}
                    className={`border rounded-sm p-3 transition-all ${
                      item.hasConflict
                        ? "border-destructive bg-destructive/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={`w-3.5 h-3.5 ${item.hasConflict ? "text-destructive" : "text-forest"}`} strokeWidth={1.5} />
                      <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                        {typeLabels[item.type]}
                      </span>
                      {item.hasConflict && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-body font-medium text-destructive">
                          <AlertTriangle className="w-3 h-3" strokeWidth={2} />
                          Conflict
                        </span>
                      )}
                    </div>
                    <h4 className="font-display text-sm font-medium text-foreground">{item.title}</h4>
                    <p className="text-[10px] font-body text-muted-foreground mt-0.5">{item.subtitle}</p>

                    {/* Smart Decision Badges */}
                    <div className="mt-2 space-y-1">
                      {item.pointsAdvice && (
                        <div className="flex items-center gap-1.5 text-[10px] font-body font-medium text-forest">
                          <span className="bg-forest/10 text-forest px-1.5 py-0.5 rounded-sm tracking-wider uppercase">
                            Points
                          </span>
                          {item.pointsAdvice}
                        </div>
                      )}
                      {item.cancellationDate && (
                        <div className="flex items-center gap-1.5 text-[10px] font-body font-medium text-amber-700">
                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm tracking-wider uppercase">
                            Deadline
                          </span>
                          Cancel by {item.cancellationLabel}
                        </div>
                      )}
                      {item.nearbyTip && (
                        <div className="flex items-center gap-1.5 text-[10px] font-body font-medium text-muted-foreground">
                          <span className="bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-sm tracking-wider uppercase">
                            Nearby
                          </span>
                          {item.nearbyTip}
                        </div>
                      )}
                      {item.hasConflict && item.conflictReason && (
                        <div className="flex items-center gap-1.5 text-[10px] font-body font-medium text-destructive">
                          <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm tracking-wider uppercase">
                            Alert
                          </span>
                          {item.conflictReason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-forest/5 border border-forest/20 rounded-sm p-3">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-xs font-body text-foreground leading-relaxed">{result.summary}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => { setPhase("input"); setResult(null); }}
                variant="outline"
                className="flex-1 font-body text-xs tracking-wider uppercase h-9"
              >
                Re-Analyze
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 font-body text-xs tracking-wider uppercase h-9"
              >
                Confirm to Timeline
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
