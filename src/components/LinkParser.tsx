import { useState } from "react";
import { Link, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { IdeaCard } from "./IdeasVault";

const MOCK_PARSED: Record<string, { title: string; subtitle: string; type: IdeaCard["type"]; location: string }> = {
  "condenast": { title: "The Best Hotels in Lake Como", subtitle: "Condé Nast Traveler · Editor's Pick", type: "hotel", location: "Lake Como, Italy" },
  "tripadvisor": { title: "Hotel Bella Riva", subtitle: "4.5★ · Lakeside luxury retreat", type: "hotel", location: "Gardone Riviera, Lake Garda" },
  "google": { title: "Best of Provence", subtitle: "Google Maps List · 12 saved places", type: "site", location: "Provence, France" },
  "opentable": { title: "Trattoria da Romano", subtitle: "OpenTable · Burano island classic", type: "restaurant", location: "Burano, Venice" },
  "booking": { title: "Hotel Accademia", subtitle: "Booking.com · Historic center charm", type: "hotel", location: "Verona, Italy" },
};

function parseUrl(url: string): { title: string; subtitle: string; type: IdeaCard["type"]; location: string } | null {
  const lower = url.toLowerCase();
  if (lower.includes("condenast") || lower.includes("cntraveler")) return MOCK_PARSED["condenast"];
  if (lower.includes("tripadvisor") || lower.includes("bellariva")) return MOCK_PARSED["tripadvisor"];
  if (lower.includes("google") || lower.includes("maps")) return MOCK_PARSED["google"];
  if (lower.includes("opentable") || lower.includes("restaurant")) return MOCK_PARSED["opentable"];
  if (lower.includes("booking") || lower.includes("accademia")) return MOCK_PARSED["booking"];

  // Fallback: extract domain name as title
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return {
      title: domain.charAt(0).toUpperCase() + domain.slice(1).split(".")[0],
      subtitle: "Imported from link",
      type: "site",
      location: "Unknown",
    };
  } catch {
    return null;
  }
}

interface LinkParserProps {
  onCardCreate: (card: Omit<IdeaCard, "id">) => void;
}

export default function LinkParser({ onCardCreate }: LinkParserProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof parseUrl>>(null);

  const handleParse = () => {
    if (!url.trim()) return;
    setLoading(true);
    setPreview(null);

    // Simulate AI parsing delay
    setTimeout(() => {
      const parsed = parseUrl(url);
      setPreview(parsed);
      setLoading(false);
    }, 600);
  };

  const handleAdd = () => {
    if (preview) {
      onCardCreate({
        type: preview.type,
        title: preview.title,
        subtitle: preview.subtitle,
        location: preview.location,
      });
      setUrl("");
      setPreview(null);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-border space-y-2">
      <div className="flex items-center gap-1.5">
        <Link className="w-3 h-3 text-forest" strokeWidth={1.5} />
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
          Quick-Add URL
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Paste a link…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleParse()}
          className="font-body text-xs h-8 flex-1"
        />
        <Button
          onClick={handleParse}
          disabled={!url.trim() || loading}
          size="sm"
          className="bg-forest text-background hover:bg-forest/90 font-body text-[10px] tracking-wider uppercase h-8 px-3"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Parse"}
        </Button>
      </div>

      {preview && (
        <div className="border border-forest/30 rounded-sm p-3 bg-forest/5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-display text-xs font-medium text-foreground">{preview.title}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-body text-muted-foreground">{preview.subtitle}</p>
          <p className="text-[10px] font-body text-muted-foreground">{preview.location}</p>
          <Button
            onClick={handleAdd}
            size="sm"
            className="w-full mt-2 bg-foreground text-background hover:bg-foreground/90 font-body text-[10px] tracking-wider uppercase h-7"
          >
            Add to Vault
          </Button>
        </div>
      )}
    </div>
  );
}
