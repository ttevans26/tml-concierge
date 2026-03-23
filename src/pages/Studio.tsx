import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import BudgetBar from "@/components/BudgetBar";
import IdeasVault from "@/components/IdeasVault";
import SandboxBoard from "@/components/SandboxBoard";
import LogisticsSidebar from "@/components/LogisticsSidebar";
import IntelligenceIngestor from "@/components/IntelligenceIngestor";
import type { IdeaCard } from "@/components/IdeasVault";
import type { ParsedItem, IngestorResult } from "@/components/IntelligenceIngestor";
import type { DeadlineEntry } from "@/components/MasterTimeline";

const ACTIVE_TRIP = "Europe Aug/Sep 2026";

export default function Studio() {
  const [, setDraggingIdea] = useState<IdeaCard | null>(null);
  const [ingestorOpen, setIngestorOpen] = useState(false);
  const [ingestedItems, setIngestedItems] = useState<ParsedItem[]>([]);
  const [extraDeadlines, setExtraDeadlines] = useState<DeadlineEntry[]>([]);

  const handleDeadlineAdd = useCallback((deadline: DeadlineEntry) => {
    setExtraDeadlines((prev) => [...prev, deadline]);
  }, []);

  const handleIngestConfirm = useCallback((result: IngestorResult) => {
    // For now, items go to the board regardless of pool selection
    // Pool routing can be expanded with persistent state
    setIngestedItems(result.items);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <BudgetBar />
      <div className="flex-1 flex min-h-0">
        {/* Left — Ideas Vault (Trip + Global sections) */}
        <aside className="w-[280px] shrink-0 border-r border-border overflow-hidden">
          <IdeasVault onDragStart={(idea) => setDraggingIdea(idea)} />
        </aside>

        {/* Center — Sandbox Board (freeform canvas) */}
        <main className="flex-1 min-w-0 border-r border-border overflow-hidden relative">
          <SandboxBoard ingestedItems={ingestedItems} />
          {/* Floating Magic Input Button */}
          <button
            onClick={() => setIngestorOpen(true)}
            className="absolute bottom-5 right-5 flex items-center gap-2 bg-forest text-primary-foreground px-4 py-2.5 rounded-sm shadow-lg hover:opacity-90 transition-all font-body text-xs font-medium tracking-wider uppercase z-50"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
            Magic Input
          </button>
        </main>

        {/* Right — Logistics Sidebar */}
        <aside className="w-[300px] shrink-0 border-l border-border overflow-hidden">
          <LogisticsSidebar extraDeadlines={extraDeadlines} />
        </aside>

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
