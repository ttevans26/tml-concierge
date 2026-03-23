import { useState } from "react";
import { Plus, Trash2, AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Booking {
  title: string;
  subtitle: string;
  confirmation?: string;
  price?: string;
  time?: string;
  cancellationDeadline?: string;
  cancellationLabel?: string;
  proTip?: string;
  amexFHR?: boolean;
  status?: "paid" | "hold" | "pending";
  prefMatch?: boolean;
}

interface TripRow {
  label: string;
  type: "logistics" | "stay" | "agenda" | "dining";
  icon: React.ComponentType<any>;
  cells: (Booking | null)[];
}

export interface InsertDayOptions {
  dayIdx: number;
  shiftForward: boolean;
}

export interface DeleteDayResult {
  dayIdx: number;
  recoveredCards: { type: string; booking: Booking }[];
}

interface InsertDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayIdx: number;
  dayLabel: string;
  onConfirm: (options: InsertDayOptions) => void;
}

export function InsertDayDialog({ open, onOpenChange, dayIdx, dayLabel, onConfirm }: InsertDayDialogProps) {
  const [shiftForward, setShiftForward] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="font-display text-lg font-medium tracking-tight text-foreground">
            Insert Day
          </DialogTitle>
          <DialogDescription className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            After {dayLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-body font-medium text-foreground">Shift following days forward</p>
              <p className="text-[10px] font-body text-muted-foreground mt-0.5">
                All bookings after this day move forward by one day
              </p>
            </div>
            <Switch checked={shiftForward} onCheckedChange={setShiftForward} />
          </div>

          {!shiftForward && (
            <div className="flex items-start gap-2 p-3 rounded-sm bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[10px] font-body text-amber-700">
                A blank day will be inserted without moving existing bookings. This may create date mismatches.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground border border-border rounded-sm py-2 hover:bg-muted/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm({ dayIdx, shiftForward });
              onOpenChange(false);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-background bg-foreground rounded-sm py-2 hover:bg-foreground/90 transition-colors"
          >
            <Plus className="w-3 h-3" strokeWidth={2} />
            Insert Day
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayIdx: number;
  dayLabel: string;
  cardsToRecover: { type: string; title: string }[];
  conflictWarnings: string[];
  onConfirm: (dayIdx: number) => void;
}

export function DeleteDayDialog({ open, onOpenChange, dayIdx, dayLabel, cardsToRecover, conflictWarnings, onConfirm }: DeleteDayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="font-display text-lg font-medium tracking-tight text-foreground">
            Remove Day
          </DialogTitle>
          <DialogDescription className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            {dayLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {cardsToRecover.length > 0 && (
            <div>
              <p className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground mb-2">
                Cards returning to Ideas Vault
              </p>
              <div className="space-y-1.5">
                {cardsToRecover.map((card, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-body text-foreground bg-muted/30 rounded-sm px-3 py-2">
                    <RotateCcw className="w-3 h-3 text-forest shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{card.title}</span>
                    <span className="text-[8px] font-body font-bold uppercase tracking-widest text-muted-foreground ml-auto shrink-0">
                      {card.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {conflictWarnings.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-body font-medium uppercase tracking-widest text-destructive">
                Logistical Conflicts
              </p>
              {conflictWarnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-sm bg-destructive/5 border border-destructive/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-[10px] font-body text-destructive">{w}</p>
                </div>
              ))}
            </div>
          )}

          {cardsToRecover.length === 0 && conflictWarnings.length === 0 && (
            <p className="text-xs font-body text-muted-foreground text-center py-4">
              This day is empty. It will be removed and following days will shift back.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground border border-border rounded-sm py-2 hover:bg-muted/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(dayIdx);
              onOpenChange(false);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-background bg-destructive rounded-sm py-2 hover:bg-destructive/90 transition-colors"
          >
            <Trash2 className="w-3 h-3" strokeWidth={2} />
            Remove Day
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface LocationSwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayIdx: number;
  oldLocation: string;
  newLocation: string;
  irrelevantCards: { type: string; title: string; reason: string }[];
  onConfirm: () => void;
}

export function LocationSwapDialog({ open, onOpenChange, dayIdx, oldLocation, newLocation, irrelevantCards, onConfirm }: LocationSwapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="font-display text-lg font-medium tracking-tight text-foreground">
            Vibe Check
          </DialogTitle>
          <DialogDescription className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            Location Change Detected
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 text-xs font-body">
            <span className="px-2.5 py-1 rounded-sm bg-muted text-muted-foreground line-through">{oldLocation}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="px-2.5 py-1 rounded-sm bg-forest/10 text-forest font-medium">{newLocation}</span>
          </div>

          {irrelevantCards.length > 0 ? (
            <div>
              <p className="text-[10px] font-body font-medium uppercase tracking-widest text-amber-700 mb-2">
                Geographically Irrelevant Cards
              </p>
              <div className="space-y-1.5">
                {irrelevantCards.map((card, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-sm bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <p className="text-[10px] font-body font-medium text-amber-800">{card.title}</p>
                      <p className="text-[9px] font-body text-amber-600 mt-0.5">{card.reason}</p>
                    </div>
                    <span className="text-[8px] font-body font-bold uppercase tracking-widest text-amber-600 ml-auto shrink-0">
                      {card.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs font-body text-muted-foreground text-center py-2">
              No conflicts detected. Safe to swap.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground border border-border rounded-sm py-2 hover:bg-muted/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-background bg-foreground rounded-sm py-2 hover:bg-foreground/90 transition-colors"
          >
            Confirm Swap
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
