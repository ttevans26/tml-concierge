import { useState, useCallback, useRef } from "react";
import { Hotel, Utensils, MapPin, Plane, X, Plus, GripVertical, Layers } from "lucide-react";
import type { IdeaCard } from "./IdeasVault";
import type { ParsedItem } from "./IntelligenceIngestor";

interface BoardCard {
  id: string;
  type: "hotel" | "restaurant" | "site" | "flight" | "stay" | "dining" | "transit";
  title: string;
  subtitle: string;
  location?: string;
  x: number;
  y: number;
  clusterId?: string;
}

interface MoodCluster {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const iconMap: Record<string, typeof Hotel> = {
  hotel: Hotel,
  stay: Hotel,
  restaurant: Utensils,
  dining: Utensils,
  site: MapPin,
  flight: Plane,
  transit: Plane,
};

const initialCards: BoardCard[] = [
  { id: "bc-1", type: "hotel", title: "The Gainsborough Bath Spa", subtitle: "YTL Hotels", location: "Bath", x: 40, y: 30 },
  { id: "bc-2", type: "hotel", title: "Roseate Villa", subtitle: "Garden Suite", location: "Bath", x: 40, y: 170 },
  { id: "bc-3", type: "restaurant", title: "Ristorante Quadri", subtitle: "St. Mark's Square views", location: "Venice", x: 340, y: 50 },
  { id: "bc-4", type: "site", title: "Peggy Guggenheim", subtitle: "Modern art on the Grand Canal", location: "Venice", x: 340, y: 190 },
];

const initialClusters: MoodCluster[] = [
  { id: "cl-1", label: "Bath Options", x: 20, y: 10, w: 280, h: 290 },
  { id: "cl-2", label: "Venice Highlights", x: 320, y: 10, w: 280, h: 290 },
];

interface SandboxBoardProps {
  ingestedItems?: ParsedItem[];
}

export default function SandboxBoard({ ingestedItems }: SandboxBoardProps) {
  const [cards, setCards] = useState<BoardCard[]>(initialCards);
  const [clusters, setClusters] = useState<MoodCluster[]>(initialClusters);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [creatingCluster, setCreatingCluster] = useState(false);
  const [clusterDraw, setClusterDraw] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [lastIngestKey, setLastIngestKey] = useState("");

  // Ingest new items onto the board
  if (ingestedItems && ingestedItems.length > 0) {
    const key = JSON.stringify(ingestedItems);
    if (key !== lastIngestKey) {
      setLastIngestKey(key);
      const newCards: BoardCard[] = ingestedItems.map((item, i) => ({
        id: `bc-${Date.now()}-${i}`,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        location: item.location,
        x: 620 + (i % 2) * 160,
        y: 30 + Math.floor(i / 2) * 140,
      }));
      setCards((prev) => [...prev, ...newCards]);
    }
  }

  const handleCardMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (creatingCluster) return;
    const card = cards.find((c) => c.id === id);
    if (!card || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    setDraggingId(id);
    setDragOffset({ x: e.clientX - rect.left - card.x, y: e.clientY - rect.top - card.y });
  }, [cards, creatingCluster]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();

    if (draggingId) {
      const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
      const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
      setCards((prev) => prev.map((c) => (c.id === draggingId ? { ...c, x, y } : c)));
    }

    if (clusterDraw) {
      setClusterDraw((prev) => prev ? { ...prev, endX: e.clientX - rect.left, endY: e.clientY - rect.top } : null);
    }
  }, [draggingId, dragOffset, clusterDraw]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
    if (clusterDraw) {
      const x = Math.min(clusterDraw.startX, clusterDraw.endX);
      const y = Math.min(clusterDraw.startY, clusterDraw.endY);
      const w = Math.abs(clusterDraw.endX - clusterDraw.startX);
      const h = Math.abs(clusterDraw.endY - clusterDraw.startY);
      if (w > 60 && h > 60) {
        setClusters((prev) => [...prev, { id: `cl-${Date.now()}`, label: "New Cluster", x, y, w, h }]);
      }
      setClusterDraw(null);
      setCreatingCluster(false);
    }
  }, [clusterDraw]);

  const handleBoardMouseDown = useCallback((e: React.MouseEvent) => {
    if (!creatingCluster || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setClusterDraw({ startX: x, startY: y, endX: x, endY: y });
  }, [creatingCluster]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!boardRef.current) return;
    try {
      const idea: IdeaCard = JSON.parse(e.dataTransfer.getData("application/json"));
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 70;
      const y = e.clientY - rect.top - 40;
      setCards((prev) => [
        ...prev,
        {
          id: `bc-${Date.now()}`,
          type: idea.type,
          title: idea.title,
          subtitle: idea.subtitle,
          location: idea.location,
          x: Math.max(0, x),
          y: Math.max(0, y),
        },
      ]);
    } catch {}
  }, []);

  const removeCard = (id: string) => setCards((prev) => prev.filter((c) => c.id !== id));
  const removeCluster = (id: string) => setClusters((prev) => prev.filter((c) => c.id !== id));

  const updateClusterLabel = (id: string, label: string) => {
    setClusters((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
            Sandbox Board
          </h2>
          <p className="text-[10px] font-body text-muted-foreground tracking-widest uppercase mt-1">
            Europe Aug/Sep 2026 · Freeform Canvas
          </p>
        </div>
        <button
          onClick={() => setCreatingCluster(!creatingCluster)}
          className={`flex items-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-wider px-3 py-1.5 rounded-sm border transition-all ${
            creatingCluster
              ? "bg-forest text-primary-foreground border-forest"
              : "bg-background text-muted-foreground border-border hover:border-forest/40"
          }`}
        >
          <Layers className="w-3 h-3" strokeWidth={1.5} />
          {creatingCluster ? "Drawing…" : "New Cluster"}
        </button>
      </div>

      <div
        ref={boardRef}
        className={`flex-1 relative overflow-auto ${creatingCluster ? "cursor-crosshair" : ""}`}
        style={{ background: "repeating-conic-gradient(hsl(var(--border)) 0% 25%, transparent 0% 50%) 50% / 24px 24px" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleBoardMouseDown}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Clusters */}
        {clusters.map((cl) => (
          <div
            key={cl.id}
            className="absolute border border-border/60 rounded-sm bg-secondary/30 group"
            style={{ left: cl.x, top: cl.y, width: cl.w, height: cl.h }}
          >
            <div className="absolute -top-5 left-1 flex items-center gap-1.5">
              <input
                value={cl.label}
                onChange={(e) => updateClusterLabel(cl.id, e.target.value)}
                className="text-[10px] font-body font-semibold uppercase tracking-widest text-muted-foreground bg-transparent border-none outline-none w-[140px]"
              />
              <button
                onClick={() => removeCluster(cl.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}

        {/* Draw preview */}
        {clusterDraw && (
          <div
            className="absolute border-2 border-dashed border-forest/40 bg-forest/5 rounded-sm pointer-events-none"
            style={{
              left: Math.min(clusterDraw.startX, clusterDraw.endX),
              top: Math.min(clusterDraw.startY, clusterDraw.endY),
              width: Math.abs(clusterDraw.endX - clusterDraw.startX),
              height: Math.abs(clusterDraw.endY - clusterDraw.startY),
            }}
          />
        )}

        {/* Cards */}
        {cards.map((card) => {
          const Icon = iconMap[card.type] || MapPin;
          return (
            <div
              key={card.id}
              className={`absolute w-[240px] border border-border rounded-sm p-3.5 bg-background shadow-sm hover:shadow-md hover:border-forest/40 transition-all select-none group ${
                draggingId === card.id ? "opacity-70 z-50" : "z-10"
              }`}
              style={{ left: card.x, top: card.y }}
              onMouseDown={(e) => handleCardMouseDown(e, card.id)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); removeCard(card.id); }}
                className="absolute top-2 right-2 w-4 h-4 rounded-sm flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
              >
                <X className="w-3 h-3" strokeWidth={2} />
              </button>

              <div className="flex items-center gap-1.5 mb-1.5">
                <GripVertical className="w-3 h-3 text-muted-foreground/40 cursor-grab" strokeWidth={1.5} />
                <Icon className="w-3 h-3 text-forest" strokeWidth={1.5} />
                <span className="text-[9px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                  {card.type === "stay" ? "Hotel" : card.type === "dining" ? "Restaurant" : card.type}
                </span>
              </div>
              <h4 className="font-display text-[13px] font-medium text-foreground leading-snug">
                {card.title}
              </h4>
              <p className="text-[10px] font-body text-muted-foreground mt-0.5">{card.subtitle}</p>
              {card.location && (
                <p className="text-[9px] font-body text-warm-gray mt-1">{card.location}</p>
              )}
            </div>
          );
        })}

        {/* Empty state hint */}
        {cards.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Plus className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
              <p className="text-xs font-body text-muted-foreground/50">
                Drag ideas from the vault or use Magic Input
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
