import { useState, useCallback } from "react";
import { Car, Utensils, Hotel, MapPin, Plane, Clock, ChevronDown, ChevronRight } from "lucide-react";
import type { IdeaCard } from "./IdeasVault";

interface TimeSlot {
  id: string;
  period: "morning" | "afternoon" | "evening";
  label: string;
  booking?: {
    type: "flight" | "transit" | "stay" | "dining" | "site";
    title: string;
    subtitle: string;
    confirmation?: string;
    time?: string;
    proTip?: string;
  };
}

interface DayItinerary {
  date: string;
  dateLabel: string;
  dayLabel: string;
  slots: TimeSlot[];
}

const initialDays: DayItinerary[] = [
  {
    date: "2026-09-06",
    dateLabel: "September 6, 2026",
    dayLabel: "Day 1 — Arrival",
    slots: [
      {
        id: "d1-morning",
        period: "morning",
        label: "Morning",
        booking: {
          type: "transit",
          title: "Hertz — Venice Airport (VCE)",
          subtitle: "Full-size SUV, GPS included",
          confirmation: "HZ-991-VCE",
          time: "10:00 AM",
          proTip: "✦ Use Chase Sapphire Reserve for 3x points on travel.",
        },
      },
      {
        id: "d1-afternoon",
        period: "afternoon",
        label: "Afternoon",
      },
      {
        id: "d1-evening",
        period: "evening",
        label: "Evening",
        booking: {
          type: "dining",
          title: "Harry's Bar",
          subtitle: "Bellini & Carpaccio — Reservations confirmed",
          time: "8:00 PM",
          proTip: "✦ Use Chase Sapphire Reserve for 3x points on dining.",
        },
      },
    ],
  },
  {
    date: "2026-09-07",
    dateLabel: "September 7, 2026",
    dayLabel: "Day 2 — Exploration",
    slots: [
      { id: "d2-morning", period: "morning", label: "Morning" },
      { id: "d2-afternoon", period: "afternoon", label: "Afternoon" },
      { id: "d2-evening", period: "evening", label: "Evening" },
    ],
  },
  {
    date: "2026-09-08",
    dateLabel: "September 8, 2026",
    dayLabel: "Day 3 — Departure",
    slots: [
      { id: "d3-morning", period: "morning", label: "Morning" },
      { id: "d3-afternoon", period: "afternoon", label: "Afternoon" },
      { id: "d3-evening", period: "evening", label: "Evening" },
    ],
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

export default function MasterTimeline() {
  const [days, setDays] = useState<DayItinerary[]>(initialDays);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    new Set(initialDays.map((d) => d.date))
  );
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

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
        setDays((prev) =>
          prev.map((day) => ({
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
                    },
                  }
                : slot
            ),
          }))
        );
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
                        {/* Period label */}
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

function BookingCard({ booking }: { booking: NonNullable<TimeSlot["booking"]> }) {
  const Icon = bookingIcons[booking.type];
  return (
    <div className="border border-border rounded-sm p-4 bg-background hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
          <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
            {booking.type === "transit" ? "Rental" : booking.type}
          </span>
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
      {booking.proTip && (
        <p className="mt-2 text-[11px] font-body font-medium text-forest">{booking.proTip}</p>
      )}
    </div>
  );
}
