import { useState } from "react";
import { Plane, Utensils } from "lucide-react";
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
}

interface StaySpan {
  name: string;
  location: string;
  startIdx: number;
  endIdx: number; // inclusive
  cancellationLabel?: string;
  cancellationDeadline?: string;
  proTip?: string;
  colorIdx: number;
}

// Gold-beige hue palette — varying hue (30-45), saturation, and lightness
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

export default function BirdsEyeView({ dayLabels, rows, onDayClick }: BirdsEyeViewProps) {
  const { getBestCard } = useProfile();
  const [hoveredBanner, setHoveredBanner] = useState<string | null>(null);

  const tripStart = new Date("2026-08-21");
  const tripEnd = new Date("2026-09-17");

  // Build calendar grid: find the Monday before tripStart and Sunday after tripEnd
  const startDay = new Date(tripStart);
  startDay.setDate(startDay.getDate() - ((startDay.getDay() + 6) % 7)); // Monday
  const endDay = new Date(tripEnd);
  endDay.setDate(endDay.getDate() + ((7 - endDay.getDay()) % 7)); // Sunday

  const totalDays = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weeks = Math.ceil(totalDays / 7);

  // Generate grid dates
  const gridDates: Date[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(startDay);
    d.setDate(d.getDate() + i);
    gridDates.push(d);
  }

  // Map date to trip dayIdx (-1 if outside trip)
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
        while (endIdx + 1 < stayRow.cells.length && stayRow.cells[endIdx + 1]?.title === name) {
          endIdx++;
        }
        const firstCell = stayRow.cells[startIdx]!;
        const colorIdx = staySpans.length % STAY_COLORS.length;
        staySpans.push({
          name,
          location: firstCell.subtitle.split("·")[0].trim(),
          startIdx,
          endIdx,
          cancellationLabel: firstCell.cancellationLabel,
          cancellationDeadline: firstCell.cancellationDeadline,
          proTip: firstCell.proTip,
          colorIdx,
        });
        i = endIdx + 1;
      } else {
        i++;
      }
    }
  }

  // Get stay for a dayIdx
  const getStayForDay = (dayIdx: number): StaySpan | undefined =>
    staySpans.find((s) => dayIdx >= s.startIdx && dayIdx <= s.endIdx);

  // Check logistics (flights)
  const logisticsRow = rows.find((r) => r.type === "logistics");
  const hasLogistics = (dayIdx: number) => logisticsRow?.cells[dayIdx] != null;

  // Check dining
  const diningRow = rows.find((r) => r.type === "dining");
  const hasDining = (dayIdx: number) => diningRow?.cells[dayIdx] != null;

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Determine month labels for header
  const firstDate = gridDates[0];
  const lastDate = gridDates[gridDates.length - 1];
  const monthLabel =
    firstDate.getMonth() === lastDate.getMonth()
      ? `${months[firstDate.getMonth()]} ${firstDate.getFullYear()}`
      : `${months[firstDate.getMonth()]} – ${months[lastDate.getMonth()]} ${lastDate.getFullYear()}`;

  // Compute banner positions for each week row
  // Each banner spans grid columns based on which days of the week fall within the stay
  type BannerInfo = {
    span: StaySpan;
    colStart: number; // 0-based within week
    colEnd: number; // inclusive
    isStart: boolean;
    isEnd: boolean;
  };

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

      // Find start and end columns within this week
      let colStart = d;
      let colEnd = d;
      for (let dd = d + 1; dd < 7; dd++) {
        const ddIdx = getDayIdx(gridDates[weekStart + dd]);
        if (ddIdx >= 0 && getStayForDay(ddIdx) === stay) {
          colEnd = dd;
        } else break;
      }

      banners.push({
        span: stay,
        colStart,
        colEnd,
        isStart: getDayIdx(gridDates[weekStart + colStart]) === stay.startIdx,
        isEnd: getDayIdx(gridDates[weekStart + colEnd]) === stay.endIdx,
      });
    }
    weekBanners.push(banners);
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-4" style={{ height: "calc(100vh - 120px)" }}>
      {/* Month Header */}
      <h3 className="font-display text-2xl font-medium text-foreground text-center mb-4 tracking-tight">
        {monthLabel}
      </h3>

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
            {/* Day numbers */}
            {Array.from({ length: 7 }).map((_, d) => {
              const date = gridDates[w * 7 + d];
              const dayIdx = getDayIdx(date);
              const inTrip = isInTrip(date);
              const flight = dayIdx >= 0 && hasLogistics(dayIdx);
              const dining = dayIdx >= 0 && hasDining(dayIdx);

              return (
                <div
                  key={d}
                  onClick={() => { if (dayIdx >= 0) onDayClick(dayIdx); }}
                  className={cn(
                    "flex flex-col p-1.5 relative transition-colors",
                    inTrip ? "cursor-pointer hover:bg-muted/40" : "opacity-30",
                    d < 6 && "border-r"
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
                      {dining && (
                        <span className="w-1.5 h-1.5 rounded-full bg-forest inline-block" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Stay banners overlaid */}
            <div className="absolute inset-0 grid grid-cols-7 pointer-events-none" style={{ paddingTop: "24px" }}>
              {weekBanners[w]?.map((banner, bi) => {
                const bannerId = `${banner.span.name}-${w}`;
                const bestCard = getBestCard("stay");
                return (
                  <div
                    key={bi}
                    className="pointer-events-auto relative"
                    style={{
                      gridColumn: `${banner.colStart + 1} / ${banner.colEnd + 2}`,
                    }}
                    onMouseEnter={() => setHoveredBanner(bannerId)}
                    onMouseLeave={() => setHoveredBanner(null)}
                  >
                    {/* Location banner */}
                    <div
                      className={cn(
                        "text-[9px] font-body font-medium text-primary-foreground px-2 py-0.5 truncate",
                        banner.isStart ? "rounded-l-sm" : "",
                        banner.isEnd ? "rounded-r-sm" : ""
                      )}
                      style={{ backgroundColor: "hsl(150, 30%, 15%)" }}
                    >
                      {banner.isStart ? banner.span.location : ""}
                    </div>
                    {/* Hotel banner */}
                    <div
                      className={cn(
                        "text-[8px] font-body text-foreground px-2 py-0.5 truncate",
                        banner.isStart ? "rounded-bl-sm" : "",
                        banner.isEnd ? "rounded-br-sm" : ""
                      )}
                      style={{ backgroundColor: "hsl(40, 20%, 92%)" }}
                    >
                      {banner.isStart ? banner.span.name : ""}
                    </div>

                    {/* Hover popup */}
                    {hoveredBanner === bannerId && banner.isStart && (
                      <div className="absolute top-full left-0 z-30 mt-1 bg-foreground text-background text-[10px] font-body px-3 py-2 rounded-sm shadow-lg whitespace-nowrap">
                        <p className="font-medium">{banner.span.name}</p>
                        <p className="text-background/70">{banner.span.location}</p>
                        {banner.span.cancellationLabel && (
                          <p className="mt-1 text-background/80">
                            Cancel by {banner.span.cancellationLabel}
                            {banner.span.cancellationDeadline && (
                              <span className="text-background/50 ml-1">
                                ({getCountdown(banner.span.cancellationDeadline)})
                              </span>
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
