import { useState, useCallback, useEffect } from "react";
import { Car, Utensils, Hotel, MapPin, Plane, Clock, ChevronDown, ChevronRight, Sparkles, AlertTriangle, CreditCard, Navigation, Check } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import type { IdeaCard } from "./IdeasVault";
import type { ParsedItem } from "./IntelligenceIngestor";

interface BookingData {
  type: "flight" | "transit" | "stay" | "dining" | "site";
  title: string;
  subtitle: string;
  confirmation?: string;
  time?: string;
  proTip?: string;
  pointsAdvice?: string;
  nearbyTip?: string;
  hasConflict?: boolean;
  conflictReason?: string;
  cancellationDate?: string;
  cancellationLabel?: string;
  isNew?: boolean;
}

interface TimeSlot {
  id: string;
  period: "morning" | "afternoon" | "evening";
  label: string;
  booking?: BookingData;
}

interface DayItinerary {
  date: string;
  dateLabel: string;
  dayLabel: string;
  slots: TimeSlot[];
}

export interface DeadlineEntry {
  id: string;
  title: string;
  type: string;
  deadline: string;
  deadlineLabel: string;
}

const initialDays: DayItinerary[] = [
  {
    date: "2026-08-21",
    dateLabel: "August 21, 2026",
    dayLabel: "Day 1 — Sherborne",
    slots: [
      { id: "d1-morning", period: "morning", label: "Morning" },
      {
        id: "d1-afternoon",
        period: "afternoon",
        label: "Afternoon",
        booking: {
          type: "stay",
          title: "Queens Arms",
          subtitle: "Sherborne, Dorset — check-in",
          time: "3:00 PM",
        },
      },
      {
        id: "d1-evening",
        period: "evening",
        label: "Evening",
        booking: {
          type: "dining",
          title: "Queens Arms Pub Dinner",
          subtitle: "Local gastropub",
          time: "7:30 PM",
          pointsAdvice: "Best Card: Chase Sapphire Reserve (3x Dining)",
        },
      },
    ],
  },
  {
    date: "2026-08-22",
    dateLabel: "August 22, 2026",
    dayLabel: "Day 2 — Bath",
    slots: [
      {
        id: "d2-morning",
        period: "morning",
        label: "Morning",
        booking: {
          type: "site",
          title: "Roman Baths & Royal Crescent",
          subtitle: "Bath city tour",
          time: "10:00 AM",
        },
      },
      {
        id: "d2-afternoon",
        period: "afternoon",
        label: "Afternoon",
        booking: {
          type: "stay",
          title: "Roseate Villa",
          subtitle: "Bath · Garden Suite",
          cancellationDate: "2026-08-18",
          cancellationLabel: "Aug 18, 2026",
        },
      },
      {
        id: "d2-evening",
        period: "evening",
        label: "Evening",
        booking: {
          type: "dining",
          title: "The Pump Room",
          subtitle: "Afternoon tea, Bath",
          time: "3:00 PM",
          pointsAdvice: "Best Card: Chase Sapphire Reserve (3x Dining)",
        },
      },
    ],
  },
  {
    date: "2026-08-24",
    dateLabel: "August 24, 2026",
    dayLabel: "Day 4 — Paris → Provence",
    slots: [
      {
        id: "d4-morning",
        period: "morning",
        label: "Morning",
        booking: {
          type: "transit",
          title: "TGV Paris → Avignon",
          subtitle: "1st Class · Gare de Lyon",
          time: "8:12 AM → 11:00 AM",
          pointsAdvice: "Best Card: Chase Sapphire Reserve (3x Transit)",
        },
      },
      {
        id: "d4-afternoon",
        period: "afternoon",
        label: "Afternoon",
        booking: {
          type: "stay",
          title: "Hotel Sous les Figuiers",
          subtitle: "St-Rémy-de-Provence",
        },
      },
      { id: "d4-evening", period: "evening", label: "Evening" },
    ],
  },
];
  },
];

const bookingIcons = {
  flight: Plane,
  transit: Car,
  stay: Hotel,
  dining: Utensils,
  site: MapPin,
};

function ideaTypeToBookingType(type: string): "stay" | "dining" | "site" {
  if (type === "hotel") return "stay";
  if (type === "restaurant") return "dining";
  return "site";
}

function getProTipForType(type: string): string {
  switch (type) {
    case "stay": return "✦ Book via Amex Travel for 5x points + FHR Credits.";
    case "dining": return "✦ Use Chase Sapphire Reserve for 3x points on dining.";
    case "flight": return "✦ Use Amex Platinum for 5x points.";
    case "transit": return "✦ Use Chase Sapphire Reserve for 3x points on travel.";
    default: return "";
  }
}

function getPointsAdvice(type: string): string {
  switch (type) {
    case "flight": return "Best Card: Amex Platinum (5x Points)";
    case "stay": return "Best Card: Chase Sapphire Reserve (3x Points)";
    case "dining": return "Best Card: Chase Sapphire Reserve (3x Dining)";
    case "transit": return "Best Card: Chase Sapphire Reserve (3x Travel)";
    default: return "";
  }
}

// Detect time-based conflicts within a day
function detectConflicts(slots: TimeSlot[]): TimeSlot[] {
  const bookings = slots.filter((s) => s.booking);
  // Check for geographic conflicts (different cities same day)
  const locations = bookings
    .map((s) => s.booking?.subtitle || "")
    .filter(Boolean);
  
  const cityKeywords = ["venice", "rome", "florence", "milan", "london", "paris", "tokyo", "verona"];
  const detectedCities = new Set<string>();
  locations.forEach((loc) => {
    const lower = loc.toLowerCase();
    cityKeywords.forEach((city) => {
      if (lower.includes(city)) detectedCities.add(city);
    });
  });

  if (detectedCities.size > 1) {
    return slots.map((s) =>
      s.booking
        ? {
            ...s,
            booking: {
              ...s.booking,
              hasConflict: true,
              conflictReason: `Geographic conflict: ${[...detectedCities].join(" & ")} on same day`,
            },
          }
        : s
    );
  }
  return slots;
}

interface MasterTimelineProps {
  onDeadlineAdd?: (deadline: DeadlineEntry) => void;
  ingestedItems?: ParsedItem[];
}

export default function MasterTimeline({ onDeadlineAdd, ingestedItems }: MasterTimelineProps) {
  const [days, setDays] = useState<DayItinerary[]>(initialDays);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    new Set(initialDays.map((d) => d.date))
  );
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Process ingested items
  const addIngestedItems = useCallback((items: ParsedItem[]) => {
    setDays((prev) => {
      const updated = prev.map((d) => ({ ...d, slots: d.slots.map((s) => ({ ...s })) }));
      
      items.forEach((item) => {
        // Find first empty slot
        for (const day of updated) {
          for (const slot of day.slots) {
            if (!slot.booking) {
              slot.booking = {
                type: item.type,
                title: item.title,
                subtitle: item.subtitle,
                time: item.time,
                proTip: getProTipForType(item.type),
                pointsAdvice: item.pointsAdvice || getPointsAdvice(item.type),
                nearbyTip: item.nearbyTip,
                hasConflict: item.hasConflict,
                conflictReason: item.conflictReason,
                cancellationDate: item.cancellationDate,
                cancellationLabel: item.cancellationLabel,
                isNew: true,
              };

              // Push deadline if found
              if (item.cancellationDate && onDeadlineAdd) {
                onDeadlineAdd({
                  id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  title: item.title,
                  type: item.type === "stay" ? "Stay" : item.type === "flight" ? "Flight" : item.type,
                  deadline: item.cancellationDate,
                  deadlineLabel: item.cancellationLabel || item.cancellationDate,
                });
              }
              return;
            }
          }
        }
      });

      // Run conflict detection per day
      return updated.map((day) => ({ ...day, slots: detectConflicts(day.slots) }));
    });
  }, [onDeadlineAdd]);

  const [lastIngestKey, setLastIngestKey] = useState("");

  useEffect(() => {
    if (ingestedItems && ingestedItems.length > 0) {
      const key = JSON.stringify(ingestedItems);
      if (key !== lastIngestKey) {
        setLastIngestKey(key);
        addIngestedItems(ingestedItems);
      }
    }
  }, [ingestedItems, addIngestedItems, lastIngestKey]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  const handleDrop = useCallback(
    (slotId: string, e: React.DragEvent) => {
      e.preventDefault();
      setDragOverSlot(null);
      try {
        const idea: IdeaCard = JSON.parse(e.dataTransfer.getData("application/json"));
        const bookingType = ideaTypeToBookingType(idea.type);
        setDays((prev) => {
          const updated = prev.map((day) => ({
            ...day,
            slots: day.slots.map((slot) =>
              slot.id === slotId && !slot.booking
                ? {
                    ...slot,
                    booking: {
                      type: bookingType,
                      title: idea.title,
                      subtitle: idea.subtitle,
                      proTip: getProTipForType(bookingType),
                      pointsAdvice: getPointsAdvice(bookingType),
                      isNew: true,
                    },
                  }
                : slot
            ),
          }));
          return updated.map((day) => ({ ...day, slots: detectConflicts(day.slots) }));
        });
      } catch {}
    },
    []
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
              Master Timeline
            </h2>
            <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase mt-1">
              Venice, Italy · Sep 6–8, 2026
            </p>
          </div>
          <span className="text-[10px] font-body font-medium uppercase tracking-widest text-forest border border-forest/30 rounded-sm px-2.5 py-1">
            Confirmed
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {days.map((day) => {
          const isExpanded = expandedDays.has(day.date);
          return (
            <div key={day.date}>
              <button
                onClick={() => toggleDay(day.date)}
                className="w-full flex items-center gap-2 mb-3 group"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                )}
                <h3 className="font-display text-base font-medium text-foreground">
                  {day.dayLabel}
                </h3>
                <span className="text-[10px] font-body text-muted-foreground tracking-wider uppercase ml-auto">
                  {day.dateLabel}
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-2 ml-5 border-l border-divider pl-5">
                  {day.slots.map((slot) => {
                    const isDragOver = dragOverSlot === slot.id;
                    return (
                      <div
                        key={slot.id}
                        onDragOver={(e) => {
                          if (!slot.booking) {
                            e.preventDefault();
                            setDragOverSlot(slot.id);
                          }
                        }}
                        onDragLeave={() => setDragOverSlot(null)}
                        onDrop={(e) => handleDrop(slot.id, e)}
                        className="relative"
                      >
                        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block">
                          {slot.label}
                        </span>

                        {slot.booking ? (
                          <BookingCard booking={slot.booking} />
                        ) : (
                          <div
                            className={`border border-dashed rounded-sm py-6 flex items-center justify-center text-xs font-body text-muted-foreground transition-colors ${
                              isDragOver
                                ? "border-forest bg-forest/5 text-forest"
                                : "border-border"
                            }`}
                          >
                            {isDragOver ? "Drop here" : "Open slot — drag an idea here"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingData }) {
  const Icon = bookingIcons[booking.type];
  const { getBestCard, matchesPreferences } = useProfile();

  // Profile-aware best card
  const bestCard = getBestCard(booking.type);
  const displayPointsAdvice = booking.pointsAdvice || bestCard;

  // Preference matching
  const tags = [booking.title, booking.subtitle].filter(Boolean);
  const prefMatches = matchesPreferences(tags);

  return (
    <div
      className={`border rounded-sm p-4 bg-background transition-all ${
        booking.hasConflict
          ? "border-destructive shadow-[0_0_0_1px_hsl(var(--destructive)/0.3)]"
          : booking.isNew
          ? "border-forest/40 shadow-[0_0_0_1px_hsl(var(--forest)/0.15)] animate-fade-in"
          : "border-border hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {booking.hasConflict ? (
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" strokeWidth={1.5} />
          ) : (
            <Icon className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
          )}
          <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
            {booking.type === "transit" ? "Rental" : booking.type}
          </span>
          {booking.isNew && (
            <span className="text-[9px] font-body font-bold uppercase tracking-widest bg-forest/10 text-forest px-1.5 py-0.5 rounded-sm">
              New
            </span>
          )}
          {prefMatches.length > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] font-body font-bold uppercase tracking-widest bg-forest/10 text-forest px-1.5 py-0.5 rounded-sm">
              <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
              Match
            </span>
          )}
        </div>
        {booking.time && (
          <div className="flex items-center gap-1 text-xs font-body text-muted-foreground">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            {booking.time}
          </div>
        )}
      </div>

      <h4 className="font-display text-sm font-medium text-foreground">{booking.title}</h4>
      <p className="text-[11px] font-body text-muted-foreground mt-0.5">{booking.subtitle}</p>

      {booking.confirmation && (
        <p className="text-[10px] font-body text-muted-foreground mt-2">
          Conf: <span className="text-foreground font-medium tracking-wide">{booking.confirmation}</span>
        </p>
      )}

      {/* Smart Decision Badges */}
      <div className="mt-2 space-y-1">
        {displayPointsAdvice && (
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3 h-3 text-forest" strokeWidth={1.5} />
            <span className="text-[10px] font-body font-medium text-forest">
              {displayPointsAdvice}
            </span>
          </div>
        )}
        {prefMatches.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-forest" strokeWidth={1.5} />
            <span className="text-[10px] font-body font-medium text-forest">
              Matches: {prefMatches.join(", ")}
            </span>
          </div>
        )}
        {booking.cancellationDate && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-700" strokeWidth={1.5} />
            <span className="text-[10px] font-body font-medium text-amber-700">
              Deadline: Cancel by {booking.cancellationLabel}
            </span>
          </div>
        )}
        {booking.nearbyTip && (
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[10px] font-body text-muted-foreground">
              {booking.nearbyTip}
            </span>
          </div>
        )}
        {booking.hasConflict && booking.conflictReason && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-destructive" strokeWidth={1.5} />
            <span className="text-[10px] font-body font-medium text-destructive">
              {booking.conflictReason}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
