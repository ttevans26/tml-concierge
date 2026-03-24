import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import BudgetBar from "@/components/BudgetBar";
import LocationVault from "@/components/LocationVault";
import ListDetailView from "@/components/ListDetailView";
import StudioMap from "@/components/StudioMap";
import IntelligenceIngestor from "@/components/IntelligenceIngestor";
import type { LocationList } from "@/components/LocationVault";
import type { ParsedItem, IngestorResult } from "@/components/IntelligenceIngestor";

const ACTIVE_TRIP = "Europe Aug/Sep 2026";

export default function Studio() {
  const [activeList, setActiveList] = useState<LocationList | null>(null);
  const [ingestorOpen, setIngestorOpen] = useState(false);
  const [ingestedItems, setIngestedItems] = useState<ParsedItem[]>([]);

  const handleIngestConfirm = useCallback((result: IngestorResult) => {
    setIngestedItems(result.items);
  }, []);

  const handleSelectList = useCallback((list: LocationList | null) => {
    setActiveList(list);
  }, []);

  const hasActiveList = activeList !== null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <BudgetBar />
      <div className="flex-1 flex min-h-0">
        {/* Left — Location Vault Sidebar */}
        <aside className="w-[260px] shrink-0 border-r border-border overflow-hidden">
          <LocationVault activeListId={activeList?.id ?? null} onSelectList={handleSelectList} />
        </aside>

        {/* Center — Map (default) or List Detail (when list selected) */}
        <main className="flex-1 min-w-0 overflow-hidden relative">
          {hasActiveList ? (
            <div
              className="h-full animate-fade-in"
              style={{ animationDuration: "0.25s" }}
            >
              <ListDetailView list={activeList} />
            </div>
          ) : (
            <div
              className="h-full animate-fade-in"
              style={{ animationDuration: "0.25s" }}
            >
              <StudioMap activeList={null} minimized={false} />
            </div>
          )}

          {/* Floating Magic Input Button */}
          <button
            onClick={() => setIngestorOpen(true)}
            className="absolute bottom-5 right-5 flex items-center gap-2 bg-forest text-primary-foreground px-4 py-2.5 rounded-sm shadow-lg hover:opacity-90 transition-all font-body text-xs font-medium tracking-wider uppercase z-50"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
            Magic Input
          </button>
        </main>

        {/* Right — Minimized Map (when list is active) */}
        {hasActiveList && (
          <aside
            className="w-[300px] shrink-0 border-l border-border overflow-hidden animate-fade-in"
            style={{ animationDuration: "0.25s" }}
          >
            <StudioMap activeList={activeList} minimized />
          </aside>
        )}

        <IntelligenceIngestor
          open={ingestorOpen}
          onOpenChange={setIngestorOpen}
          onConfirm={handleIngestConfirm}
          activeTripName={ACTIVE_TRIP}
        />
      </div>
    </div>
  );
}
