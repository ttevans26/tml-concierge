import { useState } from "react";
import { GripVertical, Hotel, Utensils, MapPin, Plus, X } from "lucide-react";

export interface IdeaCard {
  id: string;
  type: "hotel" | "restaurant" | "site";
  title: string;
  subtitle: string;
  location: string;
}

const initialIdeas: IdeaCard[] = [
  {
    id: "idea-1",
    type: "hotel",
    title: "The Gainsborough Bath Spa",
    subtitle: "YTL Hotels · Natural thermal spa",
    location: "Bath, England",
  },
  {
    id: "idea-2",
    type: "hotel",
    title: "The Connaught",
    subtitle: "Maybourne Group · Michelin-starred Hélène Darroze",
    location: "Mayfair, London",
  },
  {
    id: "idea-3",
    type: "restaurant",
    title: "Ristorante Quadri",
    subtitle: "Alajmo Group · St. Mark's Square views",
    location: "Venice, Italy",
  },
  {
    id: "idea-4",
    type: "site",
    title: "Peggy Guggenheim Collection",
    subtitle: "Modern art on the Grand Canal",
    location: "Venice, Italy",
  },
];

const iconMap = {
  hotel: Hotel,
  restaurant: Utensils,
  site: MapPin,
};

const typeLabel = {
  hotel: "Hotel",
  restaurant: "Restaurant",
  site: "Site",
};

interface IdeasVaultProps {
  onDragStart: (idea: IdeaCard) => void;
}

export default function IdeasVault({ onDragStart }: IdeasVaultProps) {
  const [ideas, setIdeas] = useState<IdeaCard[]>(initialIdeas);

  const removeIdea = (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-6 pb-4 border-b border-border">
        <h2 className="font-display text-lg font-medium tracking-tight text-foreground">
          Ideas Vault
        </h2>
        <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase mt-1">
          Scratchpad · Drag to Timeline
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {ideas.map((idea) => {
          const Icon = iconMap[idea.type];
          return (
            <div
              key={idea.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify(idea));
                onDragStart(idea);
              }}
              className="group relative border border-border rounded-sm p-4 bg-background cursor-grab active:cursor-grabbing hover:border-forest/40 hover:shadow-sm transition-all"
            >
              <button
                onClick={() => removeIdea(idea.id)}
                className="absolute top-2 right-2 w-5 h-5 rounded-sm flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" strokeWidth={1.5} />
                <Icon className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                  {typeLabel[idea.type]}
                </span>
              </div>

              <h4 className="font-display text-sm font-medium text-foreground leading-snug">
                {idea.title}
              </h4>
              <p className="text-[11px] font-body text-muted-foreground mt-0.5">
                {idea.subtitle}
              </p>
              <p className="text-[10px] font-body text-muted-foreground mt-1">
                {idea.location}
              </p>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <button className="w-full flex items-center justify-center gap-1.5 text-xs font-body font-medium text-forest border border-dashed border-forest/30 rounded-sm py-2 hover:bg-forest/5 transition-colors">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Add Idea
        </button>
      </div>
    </div>
  );
}
