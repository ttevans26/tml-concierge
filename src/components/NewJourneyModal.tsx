import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Plane, Hotel, Utensils, Sparkles, Check, Star, Dumbbell, Bath } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/contexts/ProfileContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";

interface NewJourneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (journey: {
    destination: string;
    startDate: Date;
    endDate: Date;
    days: number;
  }) => void;
}

type Step = "details" | "syncing" | "ready";

const SYNC_ITEMS = [
  { icon: Star, label: "5-Star Hotels preference", delay: 400 },
  { icon: Bath, label: "Spa & Sauna preference", delay: 800 },
  { icon: Dumbbell, label: "Gym & Fitness preference", delay: 1200 },
];

export default function NewJourneyModal({ open, onOpenChange, onConfirm }: NewJourneyModalProps) {
  const { cards, preferences } = useProfile();
  const [step, setStep] = useState<Step>("details");
  const [destination, setDestination] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [syncedItems, setSyncedItems] = useState<number[]>([]);

  // Card sync items derived from profile
  const ownedCards = cards.filter((c) => c.owned);
  const cardSyncItems = ownedCards.map((c, i) => ({
    icon: Sparkles,
    label: c.name,
    delay: 1600 + i * 400,
  }));

  const allSyncItems = [
    ...(preferences.saunaGym ? [SYNC_ITEMS[2]] : []),
    ...(preferences.spa ? [SYNC_ITEMS[1]] : []),
    { icon: Hotel, label: `Target ≤ $${preferences.targetNightlyRate}/night`, delay: 1000 },
    ...cardSyncItems,
  ].map((item, i) => ({ ...item, delay: 400 + i * 350 }));

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("details");
      setDestination("");
      setDateRange(undefined);
      setSyncedItems([]);
    }
  }, [open]);

  // Sync animation
  useEffect(() => {
    if (step !== "syncing") return;
    setSyncedItems([]);
    const timers: ReturnType<typeof setTimeout>[] = [];

    allSyncItems.forEach((item, idx) => {
      timers.push(
        setTimeout(() => {
          setSyncedItems((prev) => [...prev, idx]);
        }, item.delay)
      );
    });

    // Transition to ready after all items
    const totalDelay = allSyncItems.length > 0 ? allSyncItems[allSyncItems.length - 1].delay + 600 : 1200;
    timers.push(setTimeout(() => setStep("ready"), totalDelay));

    return () => timers.forEach(clearTimeout);
  }, [step]);

  const canProceed = destination.trim().length > 0 && dateRange?.from && dateRange?.to;

  const handleNext = () => {
    if (step === "details" && canProceed) {
      setStep("syncing");
    } else if (step === "ready" && dateRange?.from && dateRange?.to) {
      const days = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      onConfirm({
        destination,
        startDate: dateRange.from,
        endDate: dateRange.to,
        days,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-background border-border p-0 gap-0 overflow-hidden">
        {/* Step 1: Details */}
        {step === "details" && (
          <div className="p-8">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-forest" strokeWidth={1.5} />
                <span className="text-[10px] font-body font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  New Journey
                </span>
              </div>
              <DialogTitle className="font-display text-2xl font-medium text-foreground tracking-tight">
                Where to next?
              </DialogTitle>
              <DialogDescription className="text-sm font-body text-muted-foreground mt-1">
                Name your destination and choose your travel dates.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Destination */}
              <div>
                <label className="text-[10px] font-body font-medium uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
                  Destination
                </label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Japan Golden Route, Amalfi Coast"
                  className="font-body text-sm border-border bg-background focus:ring-ring h-11"
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="text-[10px] font-body font-medium uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
                  Date Range
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-body text-sm h-11",
                        !dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2 opacity-50" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM d, yyyy")} – {format(dateRange.to, "MMM d, yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        "Select travel dates"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {dateRange?.from && dateRange?.to && (
                <p className="text-xs font-body text-muted-foreground">
                  {Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} days ·{" "}
                  {Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} nights
                </p>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="w-full mt-8 bg-forest text-primary-foreground hover:bg-forest/90 font-body text-xs uppercase tracking-[0.15em] h-11"
              style={{ backgroundColor: canProceed ? "hsl(var(--forest))" : undefined }}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Profile Sync Animation */}
        {step === "syncing" && (
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="font-display text-2xl font-medium text-foreground tracking-tight">
                Applying your TML Preferences…
              </DialogTitle>
              <DialogDescription className="text-sm font-body text-muted-foreground mt-1">
                Personalising your {destination} journey.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {allSyncItems.map((item, idx) => {
                const Icon = item.icon;
                const synced = syncedItems.includes(idx);
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-sm border transition-all duration-500",
                      synced
                        ? "border-forest/30 bg-forest/5"
                        : "border-border bg-muted/30 opacity-40"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                      synced ? "bg-forest" : "bg-muted"
                    )}>
                      {synced ? (
                        <Check className="w-3 h-3 text-primary-foreground" strokeWidth={2} />
                      ) : (
                        <Icon className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-body transition-colors duration-300",
                      synced ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === "ready" && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-5 h-5 text-forest" strokeWidth={1.5} />
            </div>
            <DialogHeader className="items-center mb-6">
              <DialogTitle className="font-display text-2xl font-medium text-foreground tracking-tight">
                Your canvas is ready
              </DialogTitle>
              <DialogDescription className="text-sm font-body text-muted-foreground mt-2 max-w-[300px] mx-auto">
                {destination} · {dateRange?.from && dateRange?.to && (
                  <>
                    {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center gap-6 text-muted-foreground mb-8">
              <div className="flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                <span className="text-[10px] font-body uppercase tracking-widest">Transit flagged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Hotel className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                <span className="text-[10px] font-body uppercase tracking-widest">0 stays</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                <span className="text-[10px] font-body uppercase tracking-widest">0 dining</span>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="w-full bg-forest text-primary-foreground hover:bg-forest/90 font-body text-xs uppercase tracking-[0.15em] h-11"
              style={{ backgroundColor: "hsl(var(--forest))" }}
            >
              Open Journey
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
