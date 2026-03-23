import { useState } from "react";
import IdeasVault from "@/components/IdeasVault";
import MasterTimeline from "@/components/MasterTimeline";
import QuickHitsMap from "@/components/QuickHitsMap";
import type { IdeaCard } from "@/components/IdeasVault";

export default function Studio() {
  const [, setDraggingIdea] = useState<IdeaCard | null>(null);

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left — Ideas Vault */}
      <aside className="w-[280px] shrink-0 border-r border-border overflow-hidden">
        <IdeasVault onDragStart={(idea) => setDraggingIdea(idea)} />
      </aside>

      {/* Center — Draft Timeline */}
      <main className="flex-1 min-w-0 border-r border-border overflow-hidden">
        <MasterTimeline />
      </main>

      {/* Right — Map */}
      <aside className="w-[340px] shrink-0 overflow-y-auto p-5">
        <QuickHitsMap />
      </aside>
    </div>
  );
}
