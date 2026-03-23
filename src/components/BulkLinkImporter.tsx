import { useState } from "react";
import { Link2, Loader2, Check, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";
import type { IdeaCard } from "./IdeasVault";

type ParsedCard = Omit<IdeaCard, "id" | "pool"> & {
  vibeMatches: string[];
  tags: string[];
};

// Simulate AI parsing of URLs into discovery cards
const DOMAIN_PARSERS: Record<string, (url: string) => ParsedCard | null> = {
  "gainsborough": (url) => ({
    type: "hotel", title: "The Gainsborough Bath Spa", subtitle: "YTL Hotels · Natural thermal spa · Spa · Wellness",
    location: "Bath, England", vibeMatches: ["Spa"], tags: ["spa", "thermal", "luxury", "5-star"],
  }),
  "connaught": (url) => ({
    type: "hotel", title: "The Connaught", subtitle: "Maybourne Group · Michelin-starred · Gym · Fitness",
    location: "Mayfair, London", vibeMatches: ["Gym"], tags: ["luxury", "5-star", "gym", "fitness"],
  }),
  "aman": (url) => ({
    type: "hotel", title: "Aman Tokyo", subtitle: "Otemachi Tower · Spa · Onsen · Fitness Center",
    location: "Tokyo, Japan", vibeMatches: ["Spa"], tags: ["spa", "wellness", "luxury", "5-star", "fitness"],
  }),
  "contramar": (url) => ({
    type: "restaurant", title: "Contramar", subtitle: "Roma Norte · Iconic tuna tostadas",
    location: "Mexico City, Mexico", vibeMatches: [], tags: ["dining", "seafood"],
  }),
  "quadri": (url) => ({
    type: "restaurant", title: "Ristorante Quadri", subtitle: "Alajmo Group · St. Mark's Square views",
    location: "Venice, Italy", vibeMatches: [], tags: ["dining", "fine-dining", "michelin"],
  }),
  "guggenheim": (url) => ({
    type: "site", title: "Peggy Guggenheim Collection", subtitle: "Modern art on the Grand Canal",
    location: "Venice, Italy", vibeMatches: [], tags: ["museum", "art", "culture"],
  }),
  "adler": (url) => ({
    type: "hotel", title: "Adler Spa Resort Dolomites", subtitle: "Spa · Sauna · Gym · Alpine Wellness",
    location: "Dolomites, Italy", vibeMatches: ["Spa", "Sauna/Gym"], tags: ["spa", "sauna", "gym", "fitness", "wellness", "5-star"],
  }),
  "bellariva": (url) => ({
    type: "hotel", title: "Hotel Bella Riva", subtitle: "Lakeside · Sauna · Fitness Center",
    location: "Gardone Riviera, Lake Garda", vibeMatches: ["Sauna/Gym"], tags: ["sauna", "fitness", "lake"],
  }),
  "lido84": (url) => ({
    type: "restaurant", title: "Ristorante Lido 84", subtitle: "Michelin-starred · Lakeside tasting menu",
    location: "Gardone Riviera, Lake Garda", vibeMatches: [], tags: ["dining", "michelin", "fine-dining"],
  }),
  "booking": (url) => ({
    type: "hotel", title: "Hotel Accademia", subtitle: "Booking.com · Historic center charm",
    location: "Verona, Italy", vibeMatches: [], tags: ["hotel", "historic"],
  }),
  "tripadvisor": (url) => ({
    type: "site", title: "Top Attractions Nearby", subtitle: "TripAdvisor · Curated list",
    location: "Europe", vibeMatches: [], tags: ["attractions", "sightseeing"],
  }),
};

function parseUrls(urls: string[]): ParsedCard[] {
  const results: ParsedCard[] = [];
  for (const url of urls) {
    const lower = url.toLowerCase();
    let found = false;
    for (const [key, parser] of Object.entries(DOMAIN_PARSERS)) {
      if (lower.includes(key)) {
        const card = parser(url);
        if (card) results.push(card);
        found = true;
        break;
      }
    }
    if (!found && url.startsWith("http")) {
      try {
        const domain = new URL(url).hostname.replace("www.", "");
        results.push({
          type: "site",
          title: domain.charAt(0).toUpperCase() + domain.slice(1).split(".")[0],
          subtitle: "Imported from link",
          location: "Unknown",
          vibeMatches: [],
          tags: [],
        });
      } catch {}
    }
  }
  return results;
}

interface BulkLinkImporterProps {
  onCardsCreate: (cards: (Omit<IdeaCard, "id" | "pool"> & { vibeMatches: string[] })[]) => void;
}

export default function BulkLinkImporter({ onCardsCreate }: BulkLinkImporterProps) {
  const { preferences, matchesPreferences } = useProfile();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedCard[]>([]);

  const handleParse = () => {
    if (!text.trim()) return;
    setLoading(true);
    setParsed([]);

    // Extract URLs from pasted text
    const urlRegex = /https?:\/\/[^\s,<>"']+/g;
    const rawUrls = text.match(urlRegex) || [];
    // Also handle lines that look like domains
    const lines = text.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
    const urls = rawUrls.length > 0 ? rawUrls : lines.filter((l) => l.includes("."));

    setTimeout(() => {
      let cards = parseUrls(urls);

      // Enrich with profile-based vibe matching
      cards = cards.map((card) => {
        const profileMatches = matchesPreferences(card.tags);
        return {
          ...card,
          vibeMatches: [...new Set([...card.vibeMatches, ...profileMatches])],
        };
      });

      setParsed(cards);
      setLoading(false);
    }, 800);
  };

  const handleConfirm = () => {
    if (parsed.length === 0) return;
    onCardsCreate(parsed);
    setText("");
    setParsed([]);
  };

  return (
    <div className="px-4 py-3 border-t border-border space-y-2">
      <div className="flex items-center gap-1.5">
        <Link2 className="w-3 h-3 text-forest" strokeWidth={1.5} />
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
          Paste Research Links
        </span>
        <span className="text-[8px] font-body text-muted-foreground ml-auto">
          Google, Blogs, Maps
        </span>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Paste multiple links here…\nhttps://gainsborough.co.uk\nhttps://adlersparesort.com\nhttps://lido84.com"}
        className="font-body text-xs min-h-[64px] resize-none border-border"
        rows={3}
      />

      <Button
        onClick={handleParse}
        disabled={!text.trim() || loading}
        size="sm"
        className="w-full bg-forest text-primary-foreground hover:bg-forest/90 font-body text-[10px] tracking-wider uppercase h-8"
        style={{ backgroundColor: text.trim() && !loading ? "hsl(var(--forest))" : undefined }}
      >
        {loading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
            Parsing {text.split(/[\n,]+/).filter(Boolean).length} links…
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3 mr-1.5" strokeWidth={1.5} />
            Parse All Links
          </>
        )}
      </Button>

      {/* Parsed results preview */}
      {parsed.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[9px] font-body font-semibold uppercase tracking-widest text-forest">
            {parsed.length} Discovery Cards found
          </p>
          <div className="max-h-[200px] overflow-y-auto space-y-1.5">
            {parsed.map((card, i) => (
              <div key={i} className="border border-forest/20 rounded-sm p-2.5 bg-forest/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-[11px] font-medium text-foreground truncate">
                    {card.title}
                  </span>
                  <span className="text-[8px] font-body font-semibold uppercase tracking-widest text-muted-foreground bg-secondary px-1 py-0.5 rounded-sm shrink-0">
                    {card.type}
                  </span>
                </div>
                <p className="text-[9px] font-body text-muted-foreground mt-0.5">{card.subtitle}</p>
                <p className="text-[9px] font-body text-warm-gray">{card.location}</p>
                {card.vibeMatches.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {card.vibeMatches.map((match) => (
                      <span
                        key={match}
                        className="text-[8px] font-body font-bold uppercase tracking-widest text-forest bg-forest/10 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5"
                      >
                        <Check className="w-2.5 h-2.5" strokeWidth={2} />
                        {match} Match
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleConfirm}
            size="sm"
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-body text-[10px] tracking-wider uppercase h-8 mt-1"
          >
            <Check className="w-3 h-3 mr-1.5" strokeWidth={2} />
            Add All to Vault
          </Button>
        </div>
      )}
    </div>
  );
}
