import { DollarSign, TrendingUp, Sparkles, TrendingDown } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { useTripStore } from "@/stores/useTripStore";
import { computeBudgetFromItems } from "@/lib/tripTransforms";

interface BudgetOverride {
  label: string;
  nightlyRate: number;
  nights: number;
}

interface BudgetBarProps {
  pendingAnchor?: BudgetOverride | null;
}

export default function BudgetBar({ pendingAnchor }: BudgetBarProps) {
  const { preferences } = useProfile();
  const items = useTripStore((s) => s.items);
  const itemsLoading = useTripStore((s) => s.itemsLoading);

  // Compute from live data if available, otherwise fallback
  const liveBudget = computeBudgetFromItems(items, preferences.targetNightlyRate);
  let totalSpent = liveBudget.totalSpent;
  let nightsBooked = liveBudget.nightsBooked;
  let splurgeCredit = liveBudget.splurgeCredit;

  // If there's a pending anchor, calculate impact
  let anchorImpact = 0;
  if (pendingAnchor) {
    const anchorCost = pendingAnchor.nightlyRate * pendingAnchor.nights;
    const targetCost = preferences.targetNightlyRate * pendingAnchor.nights;
    anchorImpact = targetCost - anchorCost;
    totalSpent += anchorCost;
    nightsBooked += pendingAnchor.nights;
    splurgeCredit += anchorImpact;
  }

  const avgNightly = nightsBooked > 0 ? Math.round(totalSpent / nightsBooked) : 0;
  const isPositiveSplurge = splurgeCredit > 0;

  if (itemsLoading) {
    return (
      <div className="px-6 py-2.5 border-b border-border bg-background flex items-center gap-6">
        <div className="h-3 w-24 bg-muted animate-pulse rounded-sm" />
        <div className="w-px h-4 bg-border" />
        <div className="h-3 w-20 bg-muted animate-pulse rounded-sm" />
        <div className="w-px h-4 bg-border" />
        <div className="h-3 w-28 bg-muted animate-pulse rounded-sm" />
      </div>
    );
  }

  return (
    <div className="px-6 py-2.5 border-b border-border bg-background flex items-center gap-6">
      <div className="flex items-center gap-1.5">
        <DollarSign className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
          Total Spent
        </span>
        <span className="text-xs font-body font-semibold text-foreground ml-1">
          ${totalSpent.toLocaleString()}
        </span>
        {pendingAnchor && (
          <span className="text-[9px] font-body font-medium text-muted-foreground ml-0.5">
            (+${(pendingAnchor.nightlyRate * pendingAnchor.nights).toLocaleString()})
          </span>
        )}
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
          Avg Nightly
        </span>
        <span className={`text-xs font-body font-semibold ml-1 ${avgNightly > preferences.targetNightlyRate ? "text-destructive" : "text-foreground"}`}>
          ${avgNightly}
        </span>
        <span className="text-[9px] font-body text-muted-foreground">
          / ${preferences.targetNightlyRate} target
        </span>
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-1.5">
        <Sparkles className={`w-3 h-3 ${isPositiveSplurge ? "text-forest" : "text-destructive"}`} strokeWidth={1.5} />
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
          Splurge Credit
        </span>
        <span
          className={`text-xs font-body font-semibold ml-1 px-1.5 py-0.5 rounded-sm ${
            isPositiveSplurge ? "bg-forest/10 text-forest" : "bg-destructive/10 text-destructive"
          }`}
        >
          {isPositiveSplurge ? "+" : ""}${Math.abs(splurgeCredit).toLocaleString()}
        </span>
      </div>

      {pendingAnchor && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm ${anchorImpact >= 0 ? "bg-forest/10" : "bg-amber-50 border border-amber-200"}`}>
            {anchorImpact >= 0 ? (
              <TrendingDown className="w-3 h-3 text-forest" strokeWidth={1.5} />
            ) : (
              <TrendingUp className="w-3 h-3 text-amber-600" strokeWidth={1.5} />
            )}
            <span className={`text-[10px] font-body font-semibold uppercase tracking-wider ${anchorImpact >= 0 ? "text-forest" : "text-amber-700"}`}>
              {pendingAnchor.label}: {anchorImpact >= 0 ? "Under" : "Over"} by ${Math.abs(anchorImpact).toLocaleString()}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
