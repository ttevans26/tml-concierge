import { useState, useCallback } from "react";
import { Plane, Utensils, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/contexts/ProfileContext";

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
  cells: (Booking | null)[];
}

interface BirdsEyeViewProps {
  dayLabels: string[];
  rows: TripRow[];
  onDayClick: (dayIdx: number) => void;
  onStayDrop?: (hotelName: string, subtitle: string, startDay: number, endDay: number, price?: string) => void;
  onBannerResize?: (hotelName: string, newStartDay: number, newEndDay: number) => void;
  tripStartDate?: string;
}

interface StaySpan {
  name: string;
  location: string;
  startIdx: number;
  endIdx: number;
  cancellationLabel?: string;
  cancellationDeadline?: string;
  proTip?: string;
  colorIdx: number;
}

const STAY_COLORS: { bg: string; bgLight: string; text: string }[] = [
  { bg: "hsl(36, 45%, 38%)", bgLight: "hsl(36, 35%, 90%)", text: "#fff" },
  { bg: "hsl(30, 50%, 42%)", bgLight: "hsl(30, 40%, 91%)", text: "#fff" },
  { bg: "hsl(42, 40%, 36%)", bgLight: "hsl(42, 30%, 89%)", text: "#fff" },
  { bg: "hsl(26, 45%, 44%)", bgLight: "hsl(26, 35%, 92%)", text: "#fff" },
  { bg: "hsl(38, 55%, 32%)", bgLight: "hsl(38, 40%, 88%)", text: "#fff" },
  { bg: "hsl(44, 35%, 40%)", bgLight: "hsl(44, 25%, 90%)", text: "#fff" },
  { bg: "hsl(32, 48%, 35%)", bgLight: "hsl(32, 38%, 89%)", text: "#fff" },
  { bg: "hsl(40, 42%, 46%)", bgLight: "hsl(40, 32%, 92%)", text: "#fff" },
  { bg: "hsl(34, 52%, 30%)", bgLight: "hsl(34, 42%, 87%)", text: "#fff" },
  { bg: "hsl(28, 38%, 48%)", bgLight: "hsl(28, 28%, 93%)", text: "#fff" },
];

function getCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days}d remaining`;
}

// Known nightly rates for budget calculation
const KNOWN_RATES: Record<string, number> = {
  "the gainsborough bath spa": 480,
  "the connaught": 650,
  "roseate villa": 310,
  "hotel l'ormaie": 420,
  "hotel sous les figuiers": 375,
  "la villa port d'antibes": 350,
  "hotel accademia": 280,
  "adler spa resort": 620,
  "adler spa resort dolomites": 620,
  "hotel bella riva": 290,
  "sempione boutique hotel": 195,
  "queens arms": 185,
  "aman tokyo": 900,
};

function estimateRate(title: string, price?: string): number {
  if (price) {
    const m = price.match(/\$?([\d,]+)/);
    if (m) return parseInt(m[1].replace(",", ""));
  }
  const lower = title.toLowerCase();
  return KNOWN_RATES[lower] || 350;
}

export default function BirdsEyeView({ dayLabels, rows, onDayClick, onStayDrop, onBannerResize, tripStartDate = "2026-08-21" }: BirdsEyeViewProps) {
  const { getBestCard } = useProfile();
  const [hoveredBanner, setHoveredBanner] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [dragStartDay, setDragStartDay] = useState<number | null>(null);
  const [dragEndDay, setDragEndDay] = useState<number | null>(null);
  const [isDraggingHotel, setIsDraggingHotel] = useState(false);
  const [resizingBanner, setResizingBanner] = useState<{ name: string; edge: "start" | "end"; originalStart: number; originalEnd: number } | null>(null);

  const tripStart = new Date(tripStartDate);
  const tripEnd = new Date(tripStart);
  tripEnd.setDate(tripEnd.getDate() + dayLabels.length - 1);

  // Build calendar grid
  const startDay = new Date(tripStart);
  startDay.setDate(startDay.getDate() - ((startDay.getDay() + 6) % 7));
  const endDay = new Date(tripEnd);
  endDay.setDate(endDay.getDate() + ((7 - endDay.getDay()) % 7));

  const totalDays = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weeks = Math.ceil(totalDays / 7);

  const gridDates: Date[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(startDay);
    d.setDate(d.getDate() + i);
    gridDates.push(d);
  }

  const getDayIdx = (date: Date): number => {
    const diff = Math.round((date.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0 || diff >= dayLabels.length) return -1;
    return diff;
  };

  const isInTrip = (date: Date) => getDayIdx(date) >= 0;

  // Extract stay spans
  const stayRow = rows.find((r) => r.type === "stay");
  const staySpans: StaySpan[] = [];
  if (stayRow) {
    let i = 0;
    while (i < stayRow.cells.length) {
      const cell = stayRow.cells[i];
      if (cell) {
        const name = cell.title;
        const startIdx = i;
        let endIdx = i;
        while (endIdx + 1 < stayRow.cells.length && stayRow.cells[endIdx + 1]?.title === name) endIdx++;
        const firstCell = stayRow.cells[startIdx]!;
        staySpans.push({
          name, location: firstCell.subtitle.split("·")[0].trim(), startIdx, endIdx,
          cancellationLabel: firstCell.cancellationLabel, cancellationDeadline: firstCell.cancellationDeadline,
          proTip: firstCell.proTip, colorIdx: staySpans.length % STAY_COLORS.length,
        });
        i = endIdx + 1;
      } else { i++; }
    }
  }

  const getStayForDay = (dayIdx: number): StaySpan | undefined =>
    staySpans.find((s) => dayIdx >= s.startIdx && dayIdx <= s.endIdx);

  // Gap detection: dining without stay
  const diningRow = rows.find((r) => r.type === "dining");
  const logisticsRow = rows.find((r) => r.type === "logistics");
  const hasLogistics = (dayIdx: number) => logisticsRow?.cells[dayIdx] != null;
  const hasDining = (dayIdx: number) => diningRow?.cells[dayIdx] != null;
  const hasStay = (dayIdx: number) => stayRow?.cells[dayIdx] != null;

  const needsStayAlert = (dayIdx: number): boolean => {
    return dayIdx >= 0 && hasDining(dayIdx) && !hasStay(dayIdx) && !hasLogistics(dayIdx);
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const firstDate = gridDates[0];
  const lastDate = gridDates[gridDates.length - 1];
  const monthLabel =
    firstDate.getMonth() === lastDate.getMonth()
      ? `${months[firstDate.getMonth()]} ${firstDate.getFullYear()}`
      : `${months[firstDate.getMonth()]} – ${months[lastDate.getMonth()]} ${lastDate.getFullYear()}`;

  // Banner positions
  type BannerInfo = { span: StaySpan; colStart: number; colEnd: number; isStart: boolean; isEnd: boolean };
  const weekBanners: BannerInfo[][] = [];
  for (let w = 0; w < weeks; w++) {
    const banners: BannerInfo[] = [];
    const weekStart = w * 7;
    const processedSpans = new Set<string>();
    for (let d = 0; d < 7; d++) {
      const date = gridDates[weekStart + d];
      const dayIdx = getDayIdx(date);
      if (dayIdx < 0) continue;
      const stay = getStayForDay(dayIdx);
      if (!stay || processedSpans.has(stay.name + stay.startIdx)) continue;
      processedSpans.add(stay.name + stay.startIdx);
      let colStart = d, colEnd = d;
      for (let dd = d + 1; dd < 7; dd++) {
        const ddIdx = getDayIdx(gridDates[weekStart + dd]);
        if (ddIdx >= 0 && getStayForDay(ddIdx) === stay) colEnd = dd;
        else break;
      }
      banners.push({
        span: stay, colStart, colEnd,
        isStart: getDayIdx(gridDates[weekStart + colStart]) === stay.startIdx,
        isEnd: getDayIdx(gridDates[weekStart + colEnd]) === stay.endIdx,
      });
    }
    weekBanners.push(banners);
  }

  // Drag-and-drop handlers for hotel anchoring
  const handleDragOver = useCallback((e: React.DragEvent, dayIdx: number) => {
    if (dayIdx < 0) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverDay(dayIdx);
    setIsDraggingHotel(true);

    if (dragStartDay === null) {
      setDragStartDay(dayIdx);
      setDragEndDay(dayIdx);
    } else {
      setDragEndDay(dayIdx);
    }
  }, [dragStartDay]);

  const handleDragLeave = useCallback(() => {
    // Don't clear immediately - use a timeout to prevent flicker
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingHotel(false);
    setDragOverDay(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === "hotel" || data.type === "stay") {
        const start = Math.min(dragStartDay ?? 0, dragEndDay ?? 0);
        const end = Math.max(dragStartDay ?? 0, dragEndDay ?? 0);
        onStayDrop?.(data.title, data.subtitle || data.location || "", start, end, data.price);
      }
    } catch {}

    setDragStartDay(null);
    setDragEndDay(null);
  }, [dragStartDay, dragEndDay, onStayDrop]);

  const handleDragEnd = useCallback(() => {
    setIsDraggingHotel(false);
    setDragOverDay(null);
    setDragStartDay(null);
    setDragEndDay(null);
  }, []);

  // Compute stretch highlight range
  const stretchStart = dragStartDay !== null && dragEndDay !== null ? Math.min(dragStartDay, dragEndDay) : null;
  const stretchEnd = dragStartDay !== null && dragEndDay !== null ? Math.max(dragStartDay, dragEndDay) : null;
  const isInStretch = (dayIdx: number) =>
    stretchStart !== null && stretchEnd !== null && dayIdx >= stretchStart && dayIdx <= stretchEnd;

  return (
    <div
      className="flex-1 flex flex-col px-6 py-4"
      style={{ height: "calc(100vh - 120px)" }}
      onDragEnd={handleDragEnd}
    >
      {/* Month Header */}
      <h3 className="font-display text-2xl font-medium text-foreground text-center mb-4 tracking-tight">
        {monthLabel}
      </h3>

      {/* Drag hint */}
      {isDraggingHotel && (
        <div className="text-center mb-2">
          <span className="text-[10px] font-body font-medium uppercase tracking-widest text-forest bg-forest/10 px-3 py-1 rounded-sm">
            Drag across days to set stay duration
          </span>
        </div>
      )}

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${weeks}, 1fr)` }}>
        {Array.from({ length: weeks }).map((_, w) => (
          <div key={w} className="grid grid-cols-7 relative" style={{ borderTop: "0.2px solid hsl(var(--border))" }}>
            {/* Day cells */}
            {Array.from({ length: 7 }).map((_, d) => {
              const date = gridDates[w * 7 + d];
              const dayIdx = getDayIdx(date);
              const inTrip = isInTrip(date);
              const flight = dayIdx >= 0 && hasLogistics(dayIdx);
              const dining = dayIdx >= 0 && hasDining(dayIdx);
              const gapAlert = dayIdx >= 0 && needsStayAlert(dayIdx);
              const inStretch = dayIdx >= 0 && isInStretch(dayIdx);

              return (
                <div
                  key={d}
                  onClick={() => {
                    if (resizingBanner) return;
                    if (dayIdx >= 0) onDayClick(dayIdx);
                  }}
                  onDragOver={(e) => handleDragOver(e, dayIdx)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onMouseMove={() => {
                    if (resizingBanner && dayIdx >= 0) {
                      if (resizingBanner.edge === "end") {
                        setDragEndDay(Math.max(dayIdx, resizingBanner.originalStart));
                      } else {
                        setDragStartDay(Math.min(dayIdx, resizingBanner.originalEnd));
                      }
                    }
                  }}
                  onMouseUp={() => {
                    if (resizingBanner && onBannerResize) {
                      const newStart = resizingBanner.edge === "start" ? (dragStartDay ?? resizingBanner.originalStart) : resizingBanner.originalStart;
                      const newEnd = resizingBanner.edge === "end" ? (dragEndDay ?? resizingBanner.originalEnd) : resizingBanner.originalEnd;
                      if (newStart !== resizingBanner.originalStart || newEnd !== resizingBanner.originalEnd) {
                        onBannerResize(resizingBanner.name, newStart, newEnd);
                      }
                      setResizingBanner(null);
                      setDragStartDay(null);
                      setDragEndDay(null);
                    }
                  }}
                  className={cn(
                    "flex flex-col p-1.5 relative transition-colors",
                    inTrip ? "cursor-pointer hover:bg-muted/40" : "opacity-30",
                    d < 6 && "border-r",
                    inStretch && "bg-forest/10 ring-1 ring-inset ring-forest/30",
                  )}
                  style={{ borderColor: "hsl(var(--border) / 0.4)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-body",
                      inTrip ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {date.getDate()}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {flight && <Plane className="w-2.5 h-2.5 text-forest" strokeWidth={1.5} />}
                      {dining && <span className="w-1.5 h-1.5 rounded-full bg-forest inline-block" />}
                    </div>
                  </div>

                  {/* Gap alert: dining but no stay */}
                  {gapAlert && (
                    <div className="absolute bottom-1 left-1 right-1 flex items-center gap-0.5 bg-amber-50 border border-amber-200 rounded-sm px-1 py-0.5">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" strokeWidth={2} />
                      <span className="text-[7px] font-body font-semibold text-amber-700 truncate">
                        Need a stay?
                      </span>
                    </div>
                  )}

                  {/* Stretch preview label */}
                  {inStretch && dayIdx === stretchStart && stretchEnd !== null && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <span className="text-[7px] font-body font-bold text-forest uppercase tracking-widest">
                        {stretchEnd - stretchStart + 1} nights
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Stay banners overlaid */}
            <div className="absolute inset-0 grid grid-cols-7 pointer-events-none" style={{ paddingTop: "24px" }}>
              {weekBanners[w]?.map((banner, bi) => {
                const bannerId = `${banner.span.name}-${w}`;
                const bestCard = getBestCard("stay");
                const rate = estimateRate(banner.span.name);
                return (
                  <div
                    key={bi}
                    className="pointer-events-auto relative"
                    style={{ gridColumn: `${banner.colStart + 1} / ${banner.colEnd + 2}` }}
                    onMouseEnter={() => setHoveredBanner(bannerId)}
                    onMouseLeave={() => setHoveredBanner(null)}
                  >
                    <div
                      className={cn(
                        "text-[9px] font-body font-medium px-2 py-0.5 truncate relative",
                        banner.isStart ? "rounded-l-sm" : "",
                        banner.isEnd ? "rounded-r-sm" : ""
                      )}
                      style={{ backgroundColor: STAY_COLORS[banner.span.colorIdx].bg, color: STAY_COLORS[banner.span.colorIdx].text }}
                    >
                      {banner.isStart ? banner.span.location : ""}
                      {/* Resize handles */}
                      {banner.isStart && onBannerResize && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-background/20 transition-colors"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setResizingBanner({ name: banner.span.name, edge: "start", originalStart: banner.span.startIdx, originalEnd: banner.span.endIdx });
                            setDragStartDay(banner.span.startIdx);
                          }}
                        />
                      )}
                      {banner.isEnd && onBannerResize && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-background/20 transition-colors"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setResizingBanner({ name: banner.span.name, edge: "end", originalStart: banner.span.startIdx, originalEnd: banner.span.endIdx });
                            setDragEndDay(banner.span.endIdx);
                          }}
                        />
                      )}
                    </div>
                    <div
                      className={cn(
                        "text-[8px] font-body text-foreground px-2 py-0.5 truncate",
                        banner.isStart ? "rounded-bl-sm" : "",
                        banner.isEnd ? "rounded-br-sm" : ""
                      )}
                      style={{ backgroundColor: STAY_COLORS[banner.span.colorIdx].bgLight }}
                    >
                      {banner.isStart ? banner.span.name : ""}
                    </div>

                    {hoveredBanner === bannerId && banner.isStart && (
                      <div className="absolute top-full left-0 z-30 mt-1 bg-foreground text-background text-[10px] font-body px-3 py-2 rounded-sm shadow-lg whitespace-nowrap">
                        <p className="font-medium">{banner.span.name}</p>
                        <p className="text-background/70">{banner.span.location}</p>
                        <p className="text-background/70 mt-0.5">~${rate}/night</p>
                        {banner.span.cancellationLabel && (
                          <p className="mt-1 text-background/80">
                            Cancel by {banner.span.cancellationLabel}
                            {banner.span.cancellationDeadline && (
                              <span className="text-background/50 ml-1">({getCountdown(banner.span.cancellationDeadline)})</span>
                            )}
                          </p>
                        )}
                        {bestCard && <p className="mt-0.5 text-background/70">✦ {bestCard}</p>}
                        {banner.span.proTip && <p className="text-background/60 mt-0.5">{banner.span.proTip}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
