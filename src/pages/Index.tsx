import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IdeasVault from "@/components/IdeasVault";
import MasterTimeline from "@/components/MasterTimeline";
import LogisticsSidebar from "@/components/LogisticsSidebar";
import FriendRequest from "@/components/FriendRequest";
import type { IdeaCard } from "@/components/IdeasVault";

const Index = () => {
  const navigate = useNavigate();
  const [, setDraggingIdea] = useState<IdeaCard | null>(null);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
              TML Concierge
            </h1>
            <p className="text-[10px] font-body text-muted-foreground tracking-widest uppercase mt-0.5">
              Travel · Logistics · Lifestyle
            </p>
          </div>
          <div className="flex items-center gap-3">
            <FriendRequest />
            <button
              onClick={() => navigate("/profile")}
              className="w-8 h-8 rounded-sm bg-forest text-primary-foreground flex items-center justify-center text-xs font-body font-medium hover:opacity-90 transition-opacity"
            >
              TM
            </button>
          </div>
        </div>
      </header>

      {/* Three-column workspace */}
      <div className="flex-1 flex min-h-0">
        {/* Left — Ideas Vault */}
        <aside className="w-[280px] shrink-0 border-r border-border overflow-hidden">
          <IdeasVault onDragStart={(idea) => setDraggingIdea(idea)} />
        </aside>

        {/* Center — Master Timeline */}
        <main className="flex-1 min-w-0 border-r border-border overflow-hidden">
          <MasterTimeline />
        </main>

        {/* Right — Logistics Sidebar */}
        <aside className="w-[300px] shrink-0 overflow-hidden">
          <LogisticsSidebar />
        </aside>
      </div>
    </div>
  );
};

export default Index;
