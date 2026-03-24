import { useState } from "react";
import { Shield, Check, Sparkles, Lock } from "lucide-react";
import { detectCompletion } from "@/lib/completionDetector";
import type { TripData } from "@/lib/tripTransforms";
import { cn } from "@/lib/utils";

interface ItineraryLockBannerProps {
  trip: TripData;
  onLock: () => void;
}

export default function ItineraryLockBanner({ trip, onLock }: ItineraryLockBannerProps) {
  const [showSweep, setShowSweep] = useState(false);
  const [locked, setLocked] = useState(false);
  const status = detectCompletion(trip);

  if (!status.isComplete) return null;

  const handleLock = () => {
    setShowSweep(true);
    setTimeout(() => {
      setLocked(true);
      setTimeout(() => onLock(), 800);
    }, 1200);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Sweep animation overlay */}
      {showSweep && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div
            className="absolute inset-y-0 w-1/3 animate-sweep-right"
            style={{
              background: "linear-gradient(90deg, transparent, hsl(var(--forest) / 0.12), hsl(var(--forest) / 0.06), transparent)",
            }}
          />
        </div>
      )}

      <div
        className={cn(
          "px-6 py-3 border-b flex items-center gap-4 transition-all duration-500",
          locked
            ? "bg-forest/[0.06] border-forest/30"
            : "bg-background border-border"
        )}
      >
        <div className="flex items-center gap-2">
          {locked ? (
            <div className="w-6 h-6 rounded-full bg-forest text-primary-foreground flex items-center justify-center animate-check-in">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
          )}
          <div>
            <p className="text-xs font-body font-medium text-foreground">
              {locked ? "Itinerary Locked" : "Itinerary Complete"}
            </p>
            <p className="text-[10px] font-body text-muted-foreground">
              {locked
                ? "All stays confirmed • Active mode enabled"
                : `${status.coveragePercent}% coverage • ${status.flightCount} logistics entries`
              }
            </p>
          </div>
        </div>

        {!locked && (
          <button
            onClick={handleLock}
            className="ml-auto flex items-center gap-2 bg-forest text-primary-foreground px-4 py-2 rounded-sm text-[10px] font-body font-medium uppercase tracking-widest hover:opacity-90 transition-opacity animate-glow-pulse"
          >
            <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
            Lock & Finalize
          </button>
        )}
      </div>
    </div>
  );
}
