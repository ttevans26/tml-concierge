import LogisticsTimeline from "@/components/LogisticsTimeline";
import QuickHitsMap from "@/components/QuickHitsMap";
import ExpertBridge from "@/components/ExpertBridge";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
              TML Concierge
            </h1>
            <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase mt-0.5">
              Travel · Logistics · Lifestyle
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-forest text-primary-foreground flex items-center justify-center text-xs font-body font-medium">
              TM
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        <LogisticsTimeline />
        <QuickHitsMap />
      </main>

      {/* Expert Bridge FAB */}
      <ExpertBridge />
    </div>
  );
};

export default Index;
