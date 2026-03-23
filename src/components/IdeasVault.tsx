import { useState, useEffect } from "react";
import { GripVertical, Hotel, Utensils, MapPin, Plus, X, ChevronDown, ChevronRight, Globe, Briefcase, ArrowRightLeft, Check } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useProfile } from "@/contexts/ProfileContext";
import LinkParser from "./LinkParser";
import BulkLinkImporter from "./BulkLinkImporter";

export interface IdeaCard {
  id: string;
  type: "hotel" | "restaurant" | "site";
  title: string;
  subtitle: string;
  location: string;
  pool: "trip" | "global";
  vibeMatches?: string[];
}

const tripIdeas: IdeaCard[] = [
  { id: "idea-1", type: "hotel", title: "The Gainsborough Bath Spa", subtitle: "YTL Hotels · Natural thermal spa", location: "Bath, England", pool: "trip", vibeMatches: ["Spa"] },
  { id: "idea-2", type: "hotel", title: "The Connaught", subtitle: "Maybourne Group · Michelin-starred Hélène Darroze", location: "Mayfair, London", pool: "trip", vibeMatches: ["Gym"] },
  { id: "idea-3", type: "restaurant", title: "Ristorante Quadri", subtitle: "Alajmo Group · St. Mark's Square views", location: "Venice, Italy", pool: "trip" },
  { id: "idea-4", type: "site", title: "Peggy Guggenheim Collection", subtitle: "Modern art on the Grand Canal", location: "Venice, Italy", pool: "trip" },
];

const globalIdeas: IdeaCard[] = [
  { id: "idea-5", type: "hotel", title: "Aman Tokyo", subtitle: "Otemachi Tower · Minimalist luxury", location: "Tokyo, Japan", pool: "global", vibeMatches: ["Spa"] },
  { id: "idea-6", type: "restaurant", title: "Contramar", subtitle: "Roma Norte · Iconic tuna tostadas", location: "Mexico City, Mexico", pool: "global" },
  { id: "idea-7", type: "hotel", title: "Hotel Bella Riva", subtitle: "Lakeside luxury retreat · Lake Garda", location: "Gardone Riviera, Lake Garda", pool: "global", vibeMatches: ["Sauna/Gym"] },
  { id: "idea-8", type: "site", title: "Naoshima Art Island", subtitle: "Tadao Ando museums · Benesse House", location: "Kagawa, Japan", pool: "global" },
];

const iconMap = { hotel: Hotel, restaurant: Utensils, site: MapPin };
const typeLabel = { hotel: "Hotel", restaurant: "Restaurant", site: "Site" };

interface IdeasVaultProps {
  onDragStart: (idea: IdeaCard) => void;
  onIdeasChange?: (ideas: IdeaCard[]) => void;
}

export default function IdeasVault({ onDragStart, onIdeasChange }: IdeasVaultProps) {
  const [ideas, setIdeas] = useState<IdeaCard[]>([...tripIdeas, ...globalIdeas]);
  const [tripOpen, setTripOpen] = useState(true);
  const [globalOpen, setGlobalOpen] = useState(true);

  const trip = ideas.filter((i) => i.pool === "trip");
  const global = ideas.filter((i) => i.pool === "global");

  // Notify parent of changes for map sync
  useEffect(() => {
    onIdeasChange?.(ideas);
  }, [ideas, onIdeasChange]);

  const removeIdea = (id: string) => setIdeas((prev) => prev.filter((i) => i.id !== id));

  const togglePool = (id: string) => {
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, pool: i.pool === "trip" ? "global" : "trip" } : i));
  };

  const addIdea = (card: Omit<IdeaCard, "id" | "pool"> | Omit<IdeaCard, "id">, pool: "trip" | "global" = "global") => {
    setIdeas((prev) => [...prev, { ...card, pool, id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }]);
  };

  const addBulkCards = (cards: (Omit<IdeaCard, "id" | "pool"> & { vibeMatches: string[] })[]) => {
    const newCards: IdeaCard[] = cards.map((card, i) => ({
      ...card,
      pool: "global" as const,
      id: `idea-bulk-${Date.now()}-${i}`,
    }));
    setIdeas((prev) => [...prev, ...newCards]);
  };

  const renderCard = (idea: IdeaCard) => {
    const Icon = iconMap[idea.type];
    const hasVibeMatch = idea.vibeMatches && idea.vibeMatches.length > 0;

    return (
      <ContextMenu key={idea.id}>
        <ContextMenuTrigger>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/json", JSON.stringify(idea));
              onDragStart(idea);
            }}
            className="group relative border border-border rounded-sm p-3.5 bg-background cursor-grab active:cursor-grabbing hover:border-forest/40 hover:shadow-sm transition-all"
          >
            <button
              onClick={() => removeIdea(idea.id)}
              className="absolute top-2 right-2 w-5 h-5 rounded-sm flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <GripVertical className="w-3 h-3 text-muted-foreground/40" strokeWidth={1.5} />
              <Icon className="w-3 h-3 text-forest" strokeWidth={1.5} />
              <span className="text-[9px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                {typeLabel[idea.type]}
              </span>
            </div>

            <h4 className="font-display text-[13px] font-medium text-foreground leading-snug">
              {idea.title}
            </h4>
            <p className="text-[10px] font-body text-muted-foreground mt-0.5 leading-relaxed">
              {idea.subtitle}
            </p>
            <p className="text-[9px] font-body text-warm-gray mt-1">
              {idea.location}
            </p>

            {/* Vibe Match Badges */}
            {hasVibeMatch && (
              <div className="flex flex-wrap gap-1 mt-2">
                {idea.vibeMatches!.map((match) => (
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
        </ContextMenuTrigger>
        <ContextMenuContent className="font-body text-xs">
          <ContextMenuItem onClick={() => togglePool(idea.id)} className="gap-2">
            <ArrowRightLeft className="w-3 h-3" strokeWidth={1.5} />
            {idea.pool === "global" ? "Assign to Current Trip" : "Move to Global Pool"}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => removeIdea(idea.id)} className="gap-2 text-destructive focus:text-destructive">
            <X className="w-3 h-3" strokeWidth={1.5} />
            Remove
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-6 pb-4 border-b border-border">
        <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
          Ideas Vault
        </h2>
        <p className="text-[10px] font-body text-muted-foreground tracking-widest uppercase mt-1">
          Right-click to reassign · Drag to board
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* For This Trip */}
        <Collapsible open={tripOpen} onOpenChange={setTripOpen}>
          <CollapsibleTrigger className="w-full flex items-center gap-2 px-5 py-3 border-b border-border hover:bg-secondary/50 transition-colors">
            {tripOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} /> : <ChevronRight className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />}
            <Briefcase className="w-3 h-3 text-forest" strokeWidth={1.5} />
            <span className="text-[10px] font-body font-semibold uppercase tracking-widest text-foreground">For This Trip</span>
            <span className="ml-auto text-[9px] font-body font-medium text-forest bg-forest/10 px-1.5 py-0.5 rounded-sm">{trip.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 py-3 space-y-2">
              {trip.length === 0 ? (
                <p className="text-[10px] font-body text-muted-foreground text-center py-4">No trip-specific ideas yet. Right-click a global idea to assign it.</p>
              ) : trip.map(renderCard)}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Global Inspiration */}
        <Collapsible open={globalOpen} onOpenChange={setGlobalOpen}>
          <CollapsibleTrigger className="w-full flex items-center gap-2 px-5 py-3 border-b border-border hover:bg-secondary/50 transition-colors">
            {globalOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} /> : <ChevronRight className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />}
            <Globe className="w-3 h-3 text-warm-gray" strokeWidth={1.5} />
            <span className="text-[10px] font-body font-semibold uppercase tracking-widest text-foreground">Global Inspiration</span>
            <span className="ml-auto text-[9px] font-body font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">{global.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 py-3 space-y-2">
              {global.length === 0 ? (
                <p className="text-[10px] font-body text-muted-foreground text-center py-4">Your someday ideas live here.</p>
              ) : global.map(renderCard)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Bulk Link Importer */}
      <BulkLinkImporter onCardsCreate={addBulkCards} />

      <LinkParser onCardCreate={(card) => addIdea(card)} />

      <div className="px-4 py-3 border-t border-border">
        <button className="w-full flex items-center justify-center gap-1.5 text-xs font-body font-medium text-forest border border-dashed border-forest/30 rounded-sm py-2 hover:bg-forest/5 transition-colors">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Add Idea
        </button>
      </div>
    </div>
  );
}
