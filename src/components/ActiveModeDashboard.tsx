import { useState } from "react";
import { Shield, Check, Share2, MapPin, DollarSign, AlertTriangle, Calendar, Plane, Hotel, Utensils, Lock, ArrowLeft, Copy } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
import { buildTripBriefing } from "@/lib/completionDetector";
import { useProfile } from "@/contexts/ProfileContext";
import { cn } from "@/lib/utils";

interface ActiveModeDashboardProps {
  tripTitle: string;
  tripDates: string;
  onBack: () => void;
  onUnlock: () => void;
}

export default function ActiveModeDashboard({ tripTitle, tripDates, onBack, onUnlock }: ActiveModeDashboardProps) {
  const items = useTripStore((s) => s.items);
  const activeTrip = useTripStore((s) => s.activeTrip);
  const { preferences } = useProfile();
  const [shareClicked, setShareClicked] = useState(false);

  const days = activeTrip
    ? Math.max(1, Math.round((new Date(activeTrip.end_date || "").getTime() - new Date(activeTrip.start_date || "").getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 28;

  const briefing = buildTripBriefing(items, preferences.targetNightlyRate, days);

  const stayCount = new Set(items.filter((i) => i.type === "stay" && i.title && !i.subtitle?.startsWith("Night")).map((i) => i.title)).size;
  const logisticsCount = items.filter((i) => i.type === "logistics" || i.type === "flight").length;
  const diningCount = items.filter((i) => i.type === "dining").length;
  const agendaCount = items.filter((i) => i.type === "agenda").length;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/shared/${activeTrip?.id || "trip"}`;
    navigator.clipboard.writeText(shareUrl);
    setShareClicked(true);
    setTimeout(() => setShareClicked(false), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-8 py-5 border-b border-border flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Back
        </button>
        <div className="ml-4 flex-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-forest" strokeWidth={1.5} />
            <span className="text-[10px] font-body font-bold uppercase tracking-widest text-forest">
              Locked & Finalized
            </span>
          </div>
          <h2 className="font-display text-xl font-medium text-foreground mt-0.5">{tripTitle}</h2>
        </div>
        <button
          onClick={onUnlock}
          className="flex items-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground border border-border rounded-sm px-3 py-1.5 hover:bg-secondary transition-colors"
        >
          <Lock className="w-3 h-3" strokeWidth={1.5} />
          Unlock
        </button>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* ── Trip Briefing Card ── */}
          <div className="border border-forest/30 rounded-md p-8 bg-forest/[0.02] animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-forest text-primary-foreground flex items-center justify-center">
                <Check className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-display text-lg font-medium text-foreground">Trip Briefing</h3>
                <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">{tripDates}</p>
              </div>
            </div>

            <p className="text-base font-body text-foreground leading-relaxed mb-6">
              <span className="font-semibold">{briefing.tripDays} Days</span>
              {briefing.destinations.length > 0 && (
                <> across <span className="font-semibold">{briefing.destinations.slice(0, 3).join(", ")}</span>
                {briefing.destinations.length > 3 && ` +${briefing.destinations.length - 3} more`}</>
              )}
              {" • "}
              <span className={cn("font-semibold", briefing.isUnderBudget ? "text-forest" : "text-destructive")}>
                ${Math.abs(briefing.budgetDelta).toLocaleString()} {briefing.isUnderBudget ? "Under" : "Over"} Budget
              </span>
              {" • "}
              <span className="font-semibold">{briefing.deadlineCount} Cancellation Deadline{briefing.deadlineCount !== 1 ? "s" : ""} Monitored</span>
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={Hotel} label="Stays" value={stayCount} color="text-emerald-600" />
              <StatCard icon={Plane} label="Logistics" value={logisticsCount} color="text-blue-600" />
              <StatCard icon={Utensils} label="Dining" value={diningCount} color="text-rose-600" />
              <StatCard icon={MapPin} label="Activities" value={agendaCount} color="text-amber-600" />
            </div>
          </div>

          {/* ── Budget Summary ── */}
          <div className="border border-border rounded-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-forest" strokeWidth={1.5} />
              <h3 className="font-display text-base font-medium text-foreground">Budget Summary</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-display font-semibold text-foreground">${briefing.totalSpent.toLocaleString()}</p>
                <p className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground mt-1">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-display font-semibold text-foreground">{briefing.nightsBooked}</p>
                <p className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground mt-1">Nights Booked</p>
              </div>
              <div className="text-center">
                <p className={cn("text-2xl font-display font-semibold", briefing.isUnderBudget ? "text-forest" : "text-destructive")}>
                  {briefing.isUnderBudget ? "+" : "-"}${Math.abs(briefing.budgetDelta).toLocaleString()}
                </p>
                <p className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground mt-1">Splurge Credit</p>
              </div>
            </div>
          </div>

          {/* ── Deadline Monitor ── */}
          {briefing.deadlineCount > 0 && (
            <div className="border border-border rounded-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-forest" strokeWidth={1.5} />
                <h3 className="font-display text-base font-medium text-foreground">Active Deadlines</h3>
                <span className="ml-auto text-[10px] font-body font-bold uppercase tracking-widest bg-forest/10 text-forest px-2 py-0.5 rounded-sm">
                  {briefing.deadlineCount} Active
                </span>
              </div>
              <div className="space-y-2">
                {items
                  .filter((i) => i.cancellation_deadline && new Date(i.cancellation_deadline).getTime() > Date.now())
                  .sort((a, b) => new Date(a.cancellation_deadline!).getTime() - new Date(b.cancellation_deadline!).getTime())
                  .map((item) => {
                    const diff = Math.ceil((new Date(item.cancellation_deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const urgent = diff <= 7;
                    return (
                      <div key={item.id} className="flex items-center justify-between py-2 px-3 border border-border rounded-sm">
                        <div>
                          <p className="text-xs font-body font-medium text-foreground">{item.title}</p>
                          <p className="text-[10px] font-body text-muted-foreground">{item.subtitle}</p>
                        </div>
                        <span className={cn(
                          "text-[10px] font-body font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm",
                          urgent ? "bg-destructive/10 text-destructive" : "bg-forest/10 text-forest"
                        )}>
                          {diff}d
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Share Button ── */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleShare}
              className={cn(
                "flex items-center gap-2.5 px-8 py-3 rounded-md text-sm font-body font-medium transition-all",
                shareClicked
                  ? "bg-forest/10 text-forest border border-forest/30"
                  : "bg-forest text-primary-foreground hover:opacity-90 animate-glow-pulse"
              )}
            >
              {shareClicked ? (
                <>
                  <Check className="w-4 h-4" strokeWidth={2} />
                  Link Copied
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" strokeWidth={1.5} />
                  Share with Friends
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Hotel; label: string; value: number; color: string }) {
  return (
    <div className="text-center py-3 px-2 border border-border rounded-sm">
      <Icon className={cn("w-4 h-4 mx-auto mb-1.5", color)} strokeWidth={1.5} />
      <p className="text-xl font-display font-semibold text-foreground">{value}</p>
      <p className="text-[9px] font-body font-medium uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
