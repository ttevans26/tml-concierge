import { DollarSign, TrendingUp, Sparkles } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";

export default function BudgetBar() {
  const { budget, preferences } = useProfile();

  const avgNightly = budget.nightsBooked > 0 ? Math.round(budget.totalSpent / budget.nightsBooked) : 0;
  const isPositiveSplurge = budget.splurgeCredit > 0;

  return (
    <div className="px-6 py-2.5 border-b border-border bg-background flex items-center gap-6">
      <div className="flex items-center gap-1.5">
        <DollarSign className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
          Total Spent
        </span>
        <span className="text-xs font-body font-semibold text-foreground ml-1">
          ${budget.totalSpent.toLocaleString()}
        </span>
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
            isPositiveSplurge
              ? "bg-forest/10 text-forest"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {isPositiveSplurge ? "+" : ""}${Math.abs(budget.splurgeCredit).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
