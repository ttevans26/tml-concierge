import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import BudgetBar from "@/components/BudgetBar";
import IdeasVault from "@/components/IdeasVault";
import MasterTimeline from "@/components/MasterTimeline";
import type { DeadlineEntry } from "@/components/MasterTimeline";
import LogisticsSidebar from "@/components/LogisticsSidebar";
import IntelligenceIngestor from "@/components/IntelligenceIngestor";
import type { IdeaCard } from "@/components/IdeasVault";
import type { ParsedItem, IngestorResult } from "@/components/IntelligenceIngestor";

export default function Studio() {
  const [, setDraggingIdea] = useState<IdeaCard | null>(null);
  const [ingestorOpen, setIngestorOpen] = useState(false);
  const [ingestedItems, setIngestedItems] = useState<ParsedItem[]>([]);
  const [extraDeadlines, setExtraDeadlines] = useState<DeadlineEntry[]>([]);

  const handleDeadlineAdd = useCallback((deadline: DeadlineEntry) => {
    setExtraDeadlines((prev) => [...prev, deadline]);
  }, []);

  const handleIngestConfirm = useCallback((result: IngestorResult) => {
    setIngestedItems(result.items);
  }, []);

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left — Ideas Vault */}
      <aside className="w-[280px] shrink-0 border-r border-border overflow-hidden">
        <IdeasVault onDragStart={(idea) => setDraggingIdea(idea)} />
      </aside>

      {/* Center — Draft Timeline */}
      <main className="flex-1 min-w-0 border-r border-border overflow-hidden relative">
        <MasterTimeline
          onDeadlineAdd={handleDeadlineAdd}
          ingestedItems={ingestedItems}
        />
        {/* Floating Magic Input Button */}
        <button
          onClick={() => setIngestorOpen(true)}
          className="absolute bottom-5 right-5 flex items-center gap-2 bg-forest text-primary-foreground px-4 py-2.5 rounded-sm shadow-lg hover:opacity-90 transition-all font-body text-xs font-medium tracking-wider uppercase"
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
      />
    </div>
  );
}
