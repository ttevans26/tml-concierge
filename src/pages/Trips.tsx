import { useState, useCallback, useEffect, useMemo } from "react";
import { MapPin, ArrowLeft, Info, EyeOff, Plane, Car, Hotel, Utensils, Clock, Plus, Upload, Sparkles, Check, Share2, LayoutGrid, Calendar, Settings2, Trash2, AlertTriangle, CreditCard, Gem } from "lucide-react";
import NewJourneyModal from "@/components/NewJourneyModal";
import TripBudgetLedger from "@/components/TripBudgetLedger";
import { useProfile } from "@/contexts/ProfileContext";
import { cn } from "@/lib/utils";
import BudgetBar from "@/components/BudgetBar";
import FlightIngestor from "@/components/FlightIngestor";
import CsvImporter from "@/components/CsvImporter";
import DayEditor, { type ActivityItem } from "@/components/DayEditor";
import BirdsEyeView from "@/components/BirdsEyeView";
import DetailPanel from "@/components/DetailPanel";
import SmartSearchPanel from "@/components/SmartSearchPanel";
import LogisticsPanel, { type LogisticsEntry } from "@/components/LogisticsPanel";
import { InsertDayDialog, DeleteDayDialog, LocationSwapDialog, type InsertDayOptions } from "@/components/TripEditMode";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useTripStore } from "@/stores/useTripStore";
import { useTrips, useItineraryItems, useCreateTrip, useAddItem } from "@/hooks/useItinerary";
import { tripRecordToTripData, genDayLabels, type TripData, type Booking } from "@/lib/tripTransforms";
import { supabase } from "@/integrations/supabase/client";
import ItineraryLockBanner from "@/components/ItineraryLockBanner";
import ActiveModeDashboard from "@/components/ActiveModeDashboard";
import { detectHomelessNights, detectTimeConflicts, isDayHomeless, hasDayConflict } from "@/lib/conflictDetector";

/* ── (TripData and Booking types are imported from tripTransforms) ── */

/* Mock data removed — now loaded from database */

// Map idea types to valid matrix row types
const IDEA_TYPE_TO_ROW: Record<string, string> = {
  hotel: "stay",
  restaurant: "dining",
  site: "agenda",
  flight: "logistics",
  transit: "logistics",
};

function getCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days}d remaining`;
}

/* ── Points Optimizer Badge (Profile-aware) ── */
function PointsBadge({ rowType }: { rowType: string }) {
  const { getBestCard } = useProfile();
  const [hovered, setHovered] = useState(false);
  const typeMap: Record<string, "flight" | "stay" | "dining" | "transit" | "site"> = {
    logistics: "flight", stay: "stay", dining: "dining", agenda: "site",
  };
  const bestCard = getBestCard(typeMap[rowType] || "stay");
  if (!bestCard) return null;
  return (
    <div
      className="absolute bottom-2 right-2 z-10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Gem className="w-3 h-3 text-forest/50 hover:text-forest transition-colors cursor-help" strokeWidth={1.5} />
      {hovered && (
        <div className="absolute bottom-full right-0 mb-1 bg-foreground text-background text-[10px] font-body px-3 py-1.5 rounded-sm whitespace-nowrap shadow-lg">
          ✦ {bestCard}
        </div>
      )}
    </div>
  );
}

/* ── Legacy CardPointsTip for inline display ── */
function CardPointsTip({ cell, row }: { cell: Booking; row: { type: string } }) {
  const { getBestCard } = useProfile();
  const typeMap: Record<string, "flight" | "stay" | "dining" | "transit" | "site"> = {
    logistics: "flight", stay: "stay", dining: "dining", agenda: "site",
  };
  const bestCard = getBestCard(typeMap[row.type] || "stay");
  const tip = bestCard || cell.proTip;
  if (!tip) return null;
  return (
    <p className="mt-2 text-[10px] font-body font-medium text-forest">
      ✦ {tip}
    </p>
  );
}

/* ── Components ── */

function TripCard({ trip, onOpen }: { trip: TripData; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      className="border border-border rounded-sm p-6 bg-background hover:border-forest/40 hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
          {trip.days}-Day Itinerary
        </span>
      </div>
      <h3 className="font-display text-xl font-medium text-foreground mb-1">
        {trip.destination}
      </h3>
      <p className="text-sm font-body text-muted-foreground mb-4">{trip.dates}</p>
      <div className="flex items-center gap-3">
        {trip.rows.map((row) => {
          const Icon = row.icon;
          const filled = row.cells.filter(Boolean).length;
          return (
            <span key={row.label} className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground">
              <Icon className="w-3 h-3 text-forest" strokeWidth={1.5} />
              {filled} {row.label}
            </span>
          );
        })}
      </div>
      <p className="text-[10px] font-body text-muted-foreground mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        Click to open matrix view
      </p>
    </div>
  );
}

// Known nightly rates for budget estimation
const KNOWN_RATES: Record<string, number> = {
  "the gainsborough bath spa": 480, "the connaught": 650, "roseate villa": 310,
  "hotel l'ormaie": 420, "hotel sous les figuiers": 375, "la villa port d'antibes": 350,
  "hotel accademia": 280, "adler spa resort": 620, "adler spa resort dolomites": 620,
  "hotel bella riva": 290, "sempione boutique hotel": 195, "queens arms": 185, "aman tokyo": 900,
};

function estimateNightlyRate(title: string, price?: string): number {
  if (price) { const m = price.match(/\$?([\d,]+)/); if (m) return parseInt(m[1].replace(",", "")); }
  return KNOWN_RATES[title.toLowerCase()] || 350;
}

function MatrixView({ trip: initialTrip, onBack, isShared }: { trip: TripData; onBack: () => void; isShared?: boolean }) {
  const [trip, setTrip] = useState<TripData>(initialTrip);
  const [hoveredDeadline, setHoveredDeadline] = useState<string | null>(null);
  const [flightOpen, setFlightOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [hoveredEmpty, setHoveredEmpty] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"matrix" | "calendar" | "budget" | "active">("matrix");
  const [isLocked, setIsLocked] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<{ label: string; nightlyRate: number; nights: number } | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [insertDialog, setInsertDialog] = useState<{ dayIdx: number; dayLabel: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ dayIdx: number; dayLabel: string; cards: { type: string; title: string }[]; conflicts: string[] } | null>(null);
  const [locationSwap, setLocationSwap] = useState<{ dayIdx: number; oldLocation: string; newLocation: string; irrelevant: { type: string; title: string; reason: string }[] } | null>(null);
  const [editingLocation, setEditingLocation] = useState<{ dayIdx: number; value: string } | null>(null);
  const [locationMismatches, setLocationMismatches] = useState<Set<number>>(new Set());

  // Conflict detection (memoized from trip state)
  const homelessNights = useMemo(() => detectHomelessNights(trip), [trip]);
  const timeConflicts = useMemo(() => detectTimeConflicts(trip), [trip]);

  // Detail panel state (for populated cells)
  const [detailPanel, setDetailPanel] = useState<{
    rowType: "stay" | "dining" | "agenda" | "logistics";
    dayIdx: number;
    dayLabel: string;
    dateLabel: string;
    booking: NonNullable<typeof trip.rows[0]["cells"][0]>;
  } | null>(null);

  // Smart search state (for empty cells)
  const [searchPanel, setSearchPanel] = useState<{
    rowType: "dining" | "agenda";
    dayIdx: number;
    dayLabel: string;
    dateLabel: string;
  } | null>(null);

  // Logistics panel state (for empty logistics cells)
  const [logisticsPanel, setLogisticsPanel] = useState<{
    dayIdx: number;
    dayLabel: string;
    dateLabel: string;
  } | null>(null);

  const getDayInfo = (dayIdx: number) => {
    const dayLabel = trip.dayLabels[dayIdx] || `Day ${dayIdx + 1}`;
    const start = new Date(trip.startDate || "2026-08-21");
    start.setDate(start.getDate() + dayIdx);
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const dateLabel = `${months[start.getMonth()]} ${start.getDate()}, 2026`;
    return { dayLabel, dateLabel };
  };

  const handleCellClick = (rowType: string, dayIdx: number) => {
    const row = trip.rows.find((r) => r.type === rowType);
    const cell = row?.cells[dayIdx];
    const { dayLabel, dateLabel } = getDayInfo(dayIdx);

    if (cell && (rowType === "stay" || rowType === "dining" || rowType === "agenda" || rowType === "logistics")) {
      // Populated cell → open Detail Panel
      setDetailPanel({
        rowType: rowType as "stay" | "dining" | "agenda" | "logistics",
        dayIdx,
        dayLabel,
        dateLabel,
        booking: cell,
      });
      return;
    }

    if (!cell && (rowType === "dining" || rowType === "agenda")) {
      setSearchPanel({
        rowType: rowType as "dining" | "agenda",
        dayIdx,
        dayLabel,
        dateLabel,
      });
      return;
    }

    if (!cell && rowType === "logistics") {
      setLogisticsPanel({ dayIdx, dayLabel, dateLabel });
      return;
    }
  };

  const handleSearchSelect = (result: { title: string; subtitle: string; link?: string; time?: string }) => {
    if (!searchPanel) return;
    setTrip((prev) => {
      const updated = { ...prev, rows: prev.rows.map((row) => ({ ...row, cells: [...row.cells] })) };
      const row = updated.rows.find((r) => r.type === searchPanel.rowType);
      if (row) {
        row.cells[searchPanel.dayIdx] = {
          title: result.title,
          subtitle: result.subtitle,
          time: result.time,
        };
      }
      return updated;
    });
  };

  const handleLogisticsAdd = (entry: LogisticsEntry) => {
    if (!logisticsPanel) return;
    const typeLabels: Record<string, string> = { plane: "Flight", train: "Train", bus: "Bus", private: "Private" };
    const title = entry.transportNumber
      ? `${typeLabels[entry.transportType]} ${entry.transportNumber}`
      : `${typeLabels[entry.transportType]} Transfer`;
    const subtitle = `${entry.departureLocation} → ${entry.arrivalLocation}`;
    const time = (entry.departureTime && entry.arrivalTime)
      ? `${entry.departureTime} → ${entry.arrivalTime}`
      : entry.departureTime || entry.arrivalTime || undefined;

    setTrip((prev) => {
      const updated = { ...prev, rows: prev.rows.map((row) => ({ ...row, cells: [...row.cells] })) };
      const row = updated.rows.find((r) => r.type === "logistics");
      if (row) {
        row.cells[logisticsPanel.dayIdx] = { title, subtitle, time };
      }
      return updated;
    });
  };

  const handleFlightAdd = (flight: { flightNumber: string; date: string; departure: string; arrival: string; departureTime: string; arrivalTime: string; airline: string }) => {
    setTrip((prev) => {
      const updated = { ...prev, rows: prev.rows.map((row) => ({ ...row, cells: [...row.cells] })) };
      const logisticsRow = updated.rows.find((r) => r.type === "logistics");
      if (logisticsRow) {
        const emptyIdx = logisticsRow.cells.findIndex((c) => c === null);
        if (emptyIdx !== -1) {
          logisticsRow.cells[emptyIdx] = {
            title: `${flight.airline} ${flight.flightNumber}`,
            subtitle: `${flight.departure} → ${flight.arrival}`,
            time: `${flight.departureTime} → ${flight.arrivalTime}`,
            proTip: "✦ Use Amex Platinum for 5x points on flights.",
          };
        }
      }
      return updated;
    });
  };

  const handleCsvImport = (rows: { day: number; type: string; title: string; subtitle: string; time?: string; confirmation?: string }[]) => {
    setTrip((prev) => {
      const updated = { ...prev, rows: prev.rows.map((row) => ({ ...row, cells: [...row.cells] })) };
      rows.forEach((csvRow) => {
        const targetRow = updated.rows.find((r) => r.type === csvRow.type);
        if (targetRow) {
          const dayIdx = csvRow.day - 1;
          if (dayIdx >= 0 && dayIdx < targetRow.cells.length) {
            targetRow.cells[dayIdx] = {
              title: csvRow.title,
              subtitle: csvRow.subtitle,
              time: csvRow.time,
              confirmation: csvRow.confirmation,
            };
          }
        }
      });
      return updated;
    });
  };

  const handleDrop = (rowType: string, cellIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCell(null);
    try {
      const idea = JSON.parse(e.dataTransfer.getData("application/json"));
      const targetRowType = IDEA_TYPE_TO_ROW[idea.type];
      // Type-aware constraint: only allow drops into matching rows
      if (targetRowType && targetRowType !== rowType) return;

      setTrip((prev) => {
        const updated = { ...prev, rows: prev.rows.map((row) => ({ ...row, cells: [...row.cells] })) };
        const row = updated.rows.find((r) => r.type === rowType);
        if (row && row.cells[cellIdx] === null) {
          row.cells[cellIdx] = {
            title: idea.title,
            subtitle: idea.subtitle || idea.location || "",
          };
        }
        return updated;
      });
    } catch {}
  };

  const canDrop = (rowType: string, e: React.DragEvent): boolean => {
    // We can't read dataTransfer during dragOver, so allow visually
    return true;
  };

  // Handle stay drop from Bird's Eye View
  const handleStayDrop = (hotelName: string, subtitle: string, startDay: number, endDay: number, price?: string) => {
    const nights = endDay - startDay + 1;
    const rate = estimateNightlyRate(hotelName, price);

    // Show budget impact
    setPendingAnchor({ label: hotelName, nightlyRate: rate, nights });

    // Update trip data
    setTrip((prev) => {
      const updated = { ...prev, rows: prev.rows.map((row) => ({ ...row, cells: [...row.cells] })) };
      const stayRow = updated.rows.find((r) => r.type === "stay");
      if (stayRow) {
        for (let d = startDay; d <= endDay; d++) {
          if (d >= 0 && d < stayRow.cells.length) {
            stayRow.cells[d] = {
              title: hotelName,
              subtitle: d === startDay ? subtitle : `Night ${d - startDay + 1} of ${nights}`,
              price: d === startDay ? `$${rate}/night` : undefined,
              status: "hold" as const,
            };
          }
        }
      }
      return updated;
    });

    // Clear pending anchor after 5s
    setTimeout(() => setPendingAnchor(null), 5000);
  };

  // ── Edit Mode: Insert Day ──
  const handleInsertDay = useCallback((options: InsertDayOptions) => {
    const { dayIdx, shiftForward } = options;
    const insertAt = dayIdx + 1;
    setTrip((prev) => {
      const newDays = prev.days + 1;
      const newLabels = [...prev.dayLabels];
      newLabels.splice(insertAt, 0, `Day ${insertAt + 1} — New`);
      // Renumber labels
      const start = new Date(trip.startDate || "2026-08-21");
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      for (let i = 0; i < newLabels.length; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        newLabels[i] = `Day ${i + 1} — ${months[d.getMonth()]} ${d.getDate()}`;
      }
      const newRows = prev.rows.map((row) => {
        const cells = [...row.cells];
        if (shiftForward) {
          cells.splice(insertAt, 0, null);
        } else {
          cells.splice(insertAt, 0, null);
        }
        return { ...row, cells };
      });
      return { ...prev, days: newDays, dayLabels: newLabels, rows: newRows };
    });
    // Check for logistical conflicts after insert
    detectLocationMismatches();
  }, []);

  // ── Edit Mode: Delete Day ──
  const handleDeleteDay = useCallback((dayIdx: number) => {
    setTrip((prev) => {
      const newDays = prev.days - 1;
      const start = new Date(trip.startDate || "2026-08-21");
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const newLabels: string[] = [];
      for (let i = 0; i < newDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        newLabels.push(`Day ${i + 1} — ${months[d.getMonth()]} ${d.getDate()}`);
      }
      const newRows = prev.rows.map((row) => {
        const cells = [...row.cells];
        cells.splice(dayIdx, 1);
        return { ...row, cells };
      });
      return { ...prev, days: newDays, dayLabels: newLabels, rows: newRows };
    });
    detectLocationMismatches();
  }, []);

  // Prepare delete dialog with cards to recover and conflict detection
  const prepareDeleteDay = useCallback((dayIdx: number) => {
    const { dayLabel } = getDayInfo(dayIdx);
    const cards: { type: string; title: string }[] = [];
    trip.rows.forEach((row) => {
      const cell = row.cells[dayIdx];
      if (cell) cards.push({ type: row.label, title: cell.title });
    });

    // Detect logistical conflicts
    const conflicts: string[] = [];
    const logisticsRow = trip.rows.find((r) => r.type === "logistics");
    if (logisticsRow) {
      // Check if adjacent days have logistics that reference locations in this day's stay
      const stayRow = trip.rows.find((r) => r.type === "stay");
      const currentStay = stayRow?.cells[dayIdx];
      if (currentStay) {
        const nextLogistics = logisticsRow.cells[dayIdx + 1];
        const prevLogistics = dayIdx > 0 ? logisticsRow.cells[dayIdx - 1] : null;
        if (nextLogistics) {
          conflicts.push(`"${nextLogistics.title}" on the next day may reference a location you're removing.`);
        }
        if (prevLogistics) {
          conflicts.push(`"${prevLogistics.title}" on the previous day may create a routing gap.`);
        }
      }
    }

    setDeleteDialog({ dayIdx, dayLabel, cards, conflicts });
  }, [trip]);

  // ── Location Swap / Vibe Check ──
  const handleLocationHeaderChange = useCallback((dayIdx: number, newLocation: string) => {
    // Extract current location from the stay or agenda
    const stayRow = trip.rows.find((r) => r.type === "stay");
    const currentStay = stayRow?.cells[dayIdx];
    const oldLocation = currentStay?.subtitle?.split("·")[0]?.trim() || "";

    if (!newLocation || newLocation === oldLocation) {
      setEditingLocation(null);
      return;
    }

    // Find geographically irrelevant cards
    const irrelevant: { type: string; title: string; reason: string }[] = [];
    trip.rows.forEach((row) => {
      if (row.type === "logistics") return;
      const cell = row.cells[dayIdx];
      if (cell && cell.subtitle) {
        const cellLocation = cell.subtitle.split("·")[0].trim().toLowerCase();
        const newLoc = newLocation.toLowerCase();
        if (cellLocation && !cellLocation.includes(newLoc) && !newLoc.includes(cellLocation)) {
          irrelevant.push({
            type: row.label,
            title: cell.title,
            reason: `This ${row.type} is in ${cellLocation}, but you're now in ${newLocation}.`,
          });
        }
      }
    });

    setLocationSwap({ dayIdx, oldLocation, newLocation, irrelevant });
    setEditingLocation(null);
  }, [trip]);

  // ── Logistical Ripple Detection ──
  const detectLocationMismatches = useCallback(() => {
    const mismatches = new Set<number>();
    const logisticsRow = trip.rows.find((r) => r.type === "logistics");
    const stayRow = trip.rows.find((r) => r.type === "stay");
    if (!logisticsRow || !stayRow) return;

    for (let i = 0; i < logisticsRow.cells.length; i++) {
      const logCell = logisticsRow.cells[i];
      if (!logCell) continue;
      const subtitle = logCell.subtitle?.toLowerCase() || "";
      // Check if departure city matches the previous day's stay location
      if (i > 0 && stayRow.cells[i - 1]) {
        const prevStayLocation = stayRow.cells[i - 1]!.subtitle?.split("·")[0]?.trim()?.toLowerCase() || "";
        const departurePart = subtitle.split("→")[0]?.trim() || "";
        if (prevStayLocation && departurePart && !departurePart.includes(prevStayLocation) && !prevStayLocation.includes(departurePart)) {
          mismatches.add(i);
        }
      }
    }
    setLocationMismatches(mismatches);
  }, [trip]);

  // Handle banner resize from Bird's Eye View
  const handleBannerResize = useCallback((hotelName: string, newStartDay: number, newEndDay: number) => {
    setTrip((prev) => {
      const updated = { ...prev, rows: prev.rows.map((row) => ({ ...row, cells: [...row.cells] })) };
      const stayRow = updated.rows.find((r) => r.type === "stay");
      if (!stayRow) return updated;

      // Find current span of this hotel
      const currentStart = stayRow.cells.findIndex((c) => c?.title === hotelName);
      let currentEnd = currentStart;
      while (currentEnd + 1 < stayRow.cells.length && stayRow.cells[currentEnd + 1]?.title === hotelName) currentEnd++;

      // Clear old cells
      for (let d = currentStart; d <= currentEnd; d++) {
        if (d >= 0 && d < stayRow.cells.length) stayRow.cells[d] = null;
      }

      // Fill new range
      const nights = newEndDay - newStartDay + 1;
      const firstCell = prev.rows.find((r) => r.type === "stay")?.cells[currentStart];
      for (let d = newStartDay; d <= newEndDay; d++) {
        if (d >= 0 && d < stayRow.cells.length) {
          stayRow.cells[d] = {
            title: hotelName,
            subtitle: d === newStartDay ? (firstCell?.subtitle || "") : `Night ${d - newStartDay + 1} of ${nights}`,
            price: d === newStartDay ? firstCell?.price : undefined,
            status: firstCell?.status,
            confirmation: d === newStartDay ? firstCell?.confirmation : undefined,
            cancellationDeadline: d === newStartDay ? firstCell?.cancellationDeadline : undefined,
            cancellationLabel: d === newStartDay ? firstCell?.cancellationLabel : undefined,
            proTip: d === newStartDay ? firstCell?.proTip : undefined,
            prefMatch: firstCell?.prefMatch,
          };
        }
      }
      return updated;
    });
  }, []);


  if (isLocked) {
    return (
      <ActiveModeDashboard
        tripTitle={trip.destination}
        tripDates={trip.dates}
        onBack={onBack}
        onUnlock={() => setIsLocked(false)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <BudgetBar pendingAnchor={pendingAnchor} />
      <ItineraryLockBanner trip={trip} onLock={() => setIsLocked(true)} />
      <div className="px-8 py-5 border-b border-border flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Back
        </button>
        <div className="ml-4 flex-1">
          <h2 className="font-display text-xl font-medium text-foreground">
            {trip.destination}
          </h2>
          <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            {trip.dates}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-sm overflow-hidden mr-2">
            <button
              onClick={() => setViewMode("matrix")}
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest px-3 py-1.5 transition-colors",
                viewMode === "matrix" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/30"
              )}
            >
              <LayoutGrid className="w-3 h-3" strokeWidth={1.5} />
              Deep Dive
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest px-3 py-1.5 transition-colors",
                viewMode === "calendar" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/30"
              )}
            >
              <Calendar className="w-3 h-3" strokeWidth={1.5} />
              Bird's Eye
            </button>
            <button
              onClick={() => setViewMode("budget")}
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest px-3 py-1.5 transition-colors",
                viewMode === "budget" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/30"
              )}
            >
              <CreditCard className="w-3 h-3" strokeWidth={1.5} />
              Budget
            </button>
          </div>
          
          <button
            onClick={() => setEditMode(!editMode)}
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest rounded-sm px-3 py-1.5 transition-colors border",
              editMode
                ? "bg-foreground text-background border-foreground"
                : "text-muted-foreground border-border hover:bg-muted/30"
            )}
          >
            <Settings2 className="w-3 h-3" strokeWidth={1.5} />
            {editMode ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="px-8 py-2 bg-muted/30 border-b border-border flex items-center gap-3">
          <Settings2 className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
          <span className="text-[10px] font-body font-medium uppercase tracking-widest text-forest">
            Edit Mode Active
          </span>
          <span className="text-[10px] font-body text-muted-foreground">
            Click + to insert days · Click × to remove · Double-click column headers to rename locations
          </span>
        </div>
      )}

      {viewMode === "calendar" ? (
        <BirdsEyeView
          dayLabels={trip.dayLabels}
          rows={trip.rows}
          onDayClick={(dayIdx) => {
            setViewMode("matrix");
            setTimeout(() => {
              const el = document.querySelector(`[data-day-idx="${dayIdx}"]`);
              el?.scrollIntoView({ behavior: "smooth", inline: "start" });
            }, 100);
          }}
          onStayDrop={handleStayDrop}
          onBannerResize={handleBannerResize}
        />
      ) : viewMode === "budget" ? (
        <TripBudgetLedger rows={trip.rows} dayLabels={trip.dayLabels} />
      ) : (
      <div className="flex-1 flex overflow-hidden">
      {/* Matrix */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#F5F2ED' }}>
        <div className="min-w-max">
          {/* Column headers with Gap Detection + Edit Mode controls */}
          <div className="flex sticky top-0 z-20" style={{ borderBottom: '2px solid #D1D1D1' }}>
            <div className="w-32 shrink-0 px-4 py-3 sticky left-0 z-30" style={{ borderRight: '2px solid #D1D1D1', backgroundColor: '#F5F2ED' }} />
            {trip.dayLabels.map((label, dayIdx) => {
              const stayRow = trip.rows.find((r) => r.type === "stay");
              const logisticsRow = trip.rows.find((r) => r.type === "logistics");
              const hasStay = stayRow?.cells[dayIdx] != null;
              const hasLogistics = logisticsRow?.cells[dayIdx] != null;
              const hasGap = !hasStay && !hasLogistics;
              return (
                <div key={`${label}-${dayIdx}`} className="relative flex">
                  <div
                    data-day-idx={dayIdx}
                    className={cn(
                      "w-64 shrink-0 px-4 py-3 text-[11px] font-body font-medium uppercase tracking-widest relative",
                      hasGap ? "text-amber-700" : "text-muted-foreground",
                    )}
                    style={{
                      borderRight: '2px solid #D1D1D1',
                      backgroundColor: hasGap ? '#FFF8ED' : dayIdx % 2 === 1 ? '#EBE7E0' : '#F5F2ED',
                    }}
                    onDoubleClick={() => {
                      if (editMode) {
                        const stayCell = stayRow?.cells[dayIdx];
                        setEditingLocation({ dayIdx, value: stayCell?.subtitle?.split("·")[0]?.trim() || "" });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{label}</span>
                      {editMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); prepareDeleteDay(dayIdx); }}
                          className="ml-1 w-4 h-4 rounded-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        >
                          <Trash2 className="w-2.5 h-2.5" strokeWidth={2} />
                        </button>
                      )}
                    </div>
                    {hasGap && isDayHomeless(homelessNights, dayIdx) ? (
                      <span className="flex items-center gap-1 text-[9px] font-body font-bold tracking-widest text-amber-600 mt-0.5 normal-case">
                        <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2} />
                        Homeless Night
                      </span>
                    ) : hasGap && (
                      <span className="block text-[9px] font-body font-bold tracking-widest text-amber-600 mt-0.5 normal-case">
                        Empty Slot
                      </span>
                    )}
                    {editingLocation?.dayIdx === dayIdx && (
                      <div className="absolute top-full left-0 z-30 bg-background border border-border shadow-lg rounded-sm p-2 w-56">
                        <p className="text-[9px] font-body font-medium uppercase tracking-widest text-muted-foreground mb-1">
                          New Location
                        </p>
                        <Input
                          autoFocus
                          value={editingLocation.value}
                          onChange={(e) => setEditingLocation({ ...editingLocation, value: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleLocationHeaderChange(dayIdx, editingLocation.value);
                            if (e.key === "Escape") setEditingLocation(null);
                          }}
                          onBlur={() => handleLocationHeaderChange(dayIdx, editingLocation.value)}
                          className="h-7 text-xs font-body"
                          placeholder="e.g., Milan"
                        />
                      </div>
                    )}
                  </div>
                  {/* Insert day button between columns */}
                  {editMode && (
                    <button
                      onClick={() => setInsertDialog({ dayIdx, dayLabel: label })}
                      className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 w-5 h-5 rounded-full bg-forest text-background flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                    >
                      <Plus className="w-3 h-3" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              );
            })}
            {/* Append day at end */}
            {editMode && (
              <div className="w-16 shrink-0 flex items-center justify-center border-r border-border">
                <button
                  onClick={() => setInsertDialog({ dayIdx: trip.dayLabels.length - 1, dayLabel: trip.dayLabels[trip.dayLabels.length - 1] })}
                  className="w-8 h-8 rounded-sm border border-dashed border-forest/40 flex items-center justify-center text-forest hover:bg-forest/5 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          {/* Rows */}
          {trip.rows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex" style={{ borderBottom: '1px solid #D1D1D1' }}>
                {/* Row label */}
                <div
                  className={cn(
                    "w-32 shrink-0 px-4 py-5 flex items-center gap-2 sticky left-0 z-10",
                    row.type === "logistics" && "border-l-[3px] border-l-blue-500",
                    row.type === "stay" && "border-l-[3px] border-l-emerald-500",
                    row.type === "agenda" && "border-l-[3px] border-l-amber-500",
                    row.type === "dining" && "border-l-[3px] border-l-rose-500",
                  )}
                  style={{ borderRight: '2px solid #D1D1D1', backgroundColor: '#F5F2ED' }}
                >
                  <Icon className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                  <span className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                    {row.label}
                  </span>
                </div>

                {/* Cells */}
                {row.cells.map((cell, idx) => {
                  const cellKey = `${row.type}-${idx}`;
                  const isDragOver = dragOverCell === cellKey;
                  const isClickable = true;
                  const dayActivities: ActivityItem[] = [];
                  const relevantChits = dayActivities.filter((a: ActivityItem) =>
                    row.type === "dining" ? a.type === "restaurant" : a.type !== "restaurant"
                  );
                  const isHoveredEmpty = hoveredEmpty === cellKey;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "w-64 shrink-0 px-4 py-4 transition-colors",
                        isClickable && "cursor-pointer hover:brightness-[0.97]",
                      )}
                      style={{
                        borderRight: '2px solid #D1D1D1',
                        backgroundColor: idx % 2 === 1 ? '#EBE7E0' : '#F5F2ED',
                      }}
                      onClick={() => isClickable && handleCellClick(row.type, idx)}
                      onMouseEnter={() => { if (isClickable && !cell && relevantChits.length === 0) setHoveredEmpty(cellKey); }}
                      onMouseLeave={() => setHoveredEmpty(null)}
                      onDragOver={(e) => {
                        if (!cell) {
                          e.preventDefault();
                          setDragOverCell(cellKey);
                        }
                      }}
                      onDragLeave={() => setDragOverCell(null)}
                      onDrop={(e) => handleDrop(row.type, idx, e)}
                    >
                      {cell ? (
                        <div
                          className={cn(
                            "border rounded-sm p-3.5 transition-shadow relative",
                            cell.status === "hold" ? "border-amber-500/50" : cell.status === "paid" ? "border-forest/40" : "border-border",
                            row.type === "logistics" && locationMismatches.has(idx) && "border-destructive ring-1 ring-destructive/30",
                            row.type === "logistics" && hasDayConflict(timeConflicts, idx) && "border-destructive/60 bg-destructive/5 ring-1 ring-destructive/20"
                          )}
                          style={{ backgroundColor: hasDayConflict(timeConflicts, idx) && row.type === "logistics" ? undefined : '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                        >
                          {/* Time Conflict Alert */}
                          {row.type === "logistics" && hasDayConflict(timeConflicts, idx) && (
                            <div className="flex items-center gap-1 mb-2 px-1.5 py-1 rounded-sm bg-destructive/10">
                              <Clock className="w-2.5 h-2.5 text-destructive shrink-0" strokeWidth={2} />
                              <span className="text-[8px] font-body font-bold uppercase tracking-widest text-destructive">
                                Time Conflict
                              </span>
                            </div>
                          )}
                          {/* Location Mismatch Alert */}
                          {row.type === "logistics" && locationMismatches.has(idx) && !hasDayConflict(timeConflicts, idx) && (
                            <div className="flex items-center gap-1 mb-2 px-1.5 py-1 rounded-sm bg-destructive/10">
                              <AlertTriangle className="w-2.5 h-2.5 text-destructive shrink-0" strokeWidth={2} />
                              <span className="text-[8px] font-body font-bold uppercase tracking-widest text-destructive">
                                Location Mismatch
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-body font-medium text-foreground truncate">
                                {cell.title}
                              </span>
                              {cell.status && (
                                <span className={cn(
                                  "text-[8px] font-body font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm shrink-0",
                                  cell.status === "paid" ? "bg-forest/10 text-forest" : "bg-amber-500/10 text-amber-700"
                                )}>
                                  {cell.status}
                                </span>
                              )}
                              {cell.prefMatch && (
                                <span className="flex items-center gap-0.5 text-[8px] font-body font-bold uppercase tracking-widest bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm shrink-0">
                                  <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                                  Match
                                </span>
                              )}
                            </div>
                            {cell.cancellationDeadline && (
                              <div
                                className="relative"
                                onMouseEnter={() => setHoveredDeadline(`${row.label}-${idx}`)}
                                onMouseLeave={() => setHoveredDeadline(null)}
                              >
                                <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-forest cursor-help shrink-0" strokeWidth={1.5} />
                                {hoveredDeadline === `${row.label}-${idx}` && (
                                  <div className="absolute right-0 top-5 z-20 bg-foreground text-background text-[10px] font-body px-3 py-2 rounded-sm whitespace-nowrap shadow-lg">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3 h-3" strokeWidth={1.5} />
                                      Cancel by {cell.cancellationLabel}
                                    </div>
                                    <div className="text-background/70 mt-0.5">
                                      {getCountdown(cell.cancellationDeadline!)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] font-body text-muted-foreground truncate">
                            {cell.subtitle}
                          </p>
                          {cell.time && (
                            <p className="text-[10px] font-body text-muted-foreground mt-1">
                              {cell.time}
                            </p>
                          )}
                          {cell.confirmation && (
                            <p className="text-[10px] font-body text-muted-foreground mt-1.5">
                              Conf:{" "}
                              {isShared ? (
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                                  Redacted
                                </span>
                              ) : (
                                <span className="text-foreground font-medium tracking-wide">
                                  {cell.confirmation}
                                </span>
                              )}
                            </p>
                          )}
                          {cell.price && (
                            <p className="text-[10px] font-body text-muted-foreground mt-0.5">
                              {isShared ? (
                                <span className="inline-flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" strokeWidth={1.5} />
                                </span>
                              ) : (
                                cell.price
                              )}
                            </p>
                          )}
                          {cell.proTip && (
                            <CardPointsTip cell={cell} row={row} />
                          )}
                          {/* Points Optimizer Badge */}
                          <PointsBadge rowType={row.type} />
                          {/* Activity chits below booking */}
                          {relevantChits.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {relevantChits.map((chit) => (
                                <ActivityChit key={chit.id} item={chit} />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : relevantChits.length > 0 ? (
                        <div className="space-y-1">
                          {relevantChits.map((chit) => (
                            <ActivityChit key={chit.id} item={chit} />
                          ))}
                        </div>
                      ) : (
                      (() => {
                        const homeless = row.type === "stay" && isDayHomeless(homelessNights, idx);
                        return (
                          <div
                            className={cn(
                              "border rounded-sm py-6 flex flex-col items-center justify-center text-[10px] font-body text-muted-foreground transition-colors",
                              isDragOver ? "border-forest bg-forest/5 text-forest" : homeless ? "border-amber-400 bg-amber-50/50 border-dashed" : "border-dashed border-border"
                            )}
                          >
                            {isDragOver ? "Drop here" : homeless ? (
                              <div className="flex flex-col items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" strokeWidth={1.5} />
                                <span className="text-[8px] font-body font-semibold text-amber-600 uppercase tracking-widest">
                                  Stay Required
                                </span>
                              </div>
                            ) : isHoveredEmpty ? (
                              <Plus className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                            ) : "—"}
                          </div>
                        );
                      })()
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {/* Logistics Sidebar */}
      <div className="w-72 shrink-0 border-l border-border bg-background overflow-hidden">
        <LogisticsSidebar trip={trip} onLock={() => setIsLocked(true)} tripId={trip.id} />
      </div>
      </div>
      )}

      <FlightIngestor open={flightOpen} onOpenChange={setFlightOpen} onFlightAdd={handleFlightAdd} />
      <CsvImporter open={csvOpen} onOpenChange={setCsvOpen} onImport={handleCsvImport} />
      {detailPanel && (
        <DetailPanel
          open={!!detailPanel}
          onOpenChange={(open) => { if (!open) setDetailPanel(null); }}
          rowType={detailPanel.rowType}
          dayLabel={detailPanel.dayLabel}
          dateLabel={detailPanel.dateLabel}
          booking={detailPanel.booking}
        />
      )}
      {searchPanel && (
        <SmartSearchPanel
          open={!!searchPanel}
          onOpenChange={(open) => { if (!open) setSearchPanel(null); }}
          rowType={searchPanel.rowType}
          dayLabel={searchPanel.dayLabel}
          dateLabel={searchPanel.dateLabel}
          onSelect={handleSearchSelect}
        />
      )}
      {logisticsPanel && (
        <LogisticsPanel
          open={!!logisticsPanel}
          onOpenChange={(open) => { if (!open) setLogisticsPanel(null); }}
          dayLabel={logisticsPanel.dayLabel}
          dateLabel={logisticsPanel.dateLabel}
          initialDate={(() => { const d = new Date(trip.startDate || "2026-08-21"); d.setDate(d.getDate() + logisticsPanel.dayIdx); return d; })()}
          onAdd={handleLogisticsAdd}
        />
      )}

      {/* Edit Mode Dialogs */}
      {insertDialog && (
        <InsertDayDialog
          open={!!insertDialog}
          onOpenChange={(open) => { if (!open) setInsertDialog(null); }}
          dayIdx={insertDialog.dayIdx}
          dayLabel={insertDialog.dayLabel}
          onConfirm={handleInsertDay}
        />
      )}
      {deleteDialog && (
        <DeleteDayDialog
          open={!!deleteDialog}
          onOpenChange={(open) => { if (!open) setDeleteDialog(null); }}
          dayIdx={deleteDialog.dayIdx}
          dayLabel={deleteDialog.dayLabel}
          cardsToRecover={deleteDialog.cards}
          conflictWarnings={deleteDialog.conflicts}
          onConfirm={handleDeleteDay}
        />
      )}
      {locationSwap && (
        <LocationSwapDialog
          open={!!locationSwap}
          onOpenChange={(open) => { if (!open) setLocationSwap(null); }}
          dayIdx={locationSwap.dayIdx}
          oldLocation={locationSwap.oldLocation}
          newLocation={locationSwap.newLocation}
          irrelevantCards={locationSwap.irrelevant}
          onConfirm={() => setLocationSwap(null)}
        />
      )}
    </div>
  );
}

/* ── Activity Chit ── */
function ActivityChit({ item }: { item: ActivityItem }) {
  const borderColor = item.type === "restaurant" ? "border-l-forest" : "border-l-foreground";
  const statusStyle: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    pinned: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    confirmed: "bg-forest/10 text-forest",
  };
  return (
    <div className={cn("border rounded-sm px-2 py-1.5 bg-background border-l-[3px]", borderColor)}>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-body font-medium text-foreground truncate flex-1">
          {item.title}
        </span>
        <span className={cn(
          "text-[7px] font-body font-bold uppercase tracking-widest px-1 py-0.5 rounded-sm shrink-0",
          statusStyle[item.status]
        )}>
          {item.status}
        </span>
      </div>
      {item.time && (
        <p className="text-[9px] font-body text-muted-foreground">{item.time}</p>
      )}
    </div>
  );
}

export default function Trips() {
  const { user } = useAuth();
  const { trips: tripRecords, tripsLoading, setActiveTrip } = useTripStore();
  const items = useTripStore((s) => s.items);
  const [openTripId, setOpenTripId] = useState<string | null>(null);
  const [newJourneyOpen, setNewJourneyOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Fetch trips from DB
  useTrips();

  // Fetch items for open trip
  useItineraryItems(openTripId);

  const createTrip = useCreateTrip();

  // Auto-seed on first load if no trips exist
  useEffect(() => {
    if (!tripsLoading && tripRecords.length === 0 && user && !seeded) {
      setSeeded(true);
      const seedTrip = async () => {
        try {
          await supabase.functions.invoke("seed-europe-trip");
          // Refetch after seeding
          window.location.reload();
        } catch (e) {
          console.error("Seed failed:", e);
        }
      };
      seedTrip();
    }
  }, [tripsLoading, tripRecords.length, user, seeded]);

  // Convert active trip record + items to TripData for the matrix
  const activeRecord = tripRecords.find((t) => t.id === openTripId);
  const openTrip = activeRecord ? tripRecordToTripData(activeRecord, items) : null;

  const handleNewJourney = async (journey: { destination: string; startDate: Date; endDate: Date; days: number }) => {
    if (!user) return;
    const startDate = journey.startDate.toISOString().split("T")[0];
    const endDate = journey.endDate.toISOString().split("T")[0];

    const result = await createTrip.mutateAsync({
      user_id: user.id,
      title: journey.destination,
      destination: journey.destination,
      start_date: startDate,
      end_date: endDate,
    });

    setOpenTripId(result.id);
    setActiveTrip(result);
  };

  const handleOpenTrip = (tripId: string) => {
    const record = tripRecords.find((t) => t.id === tripId);
    if (record) {
      setActiveTrip(record);
      setOpenTripId(tripId);
    }
  };

  if (openTrip) {
    return (
      <MatrixView
        trip={openTrip}
        onBack={() => {
          setOpenTripId(null);
          setActiveTrip(null);
        }}
      />
    );
  }

  // Loading skeleton
  if (tripsLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <BudgetBar />
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 w-40 bg-muted animate-pulse rounded-sm mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2].map((i) => (
                <div key={i} className="border border-border rounded-sm p-6 space-y-3">
                  <div className="h-3 w-24 bg-muted animate-pulse rounded-sm" />
                  <div className="h-5 w-48 bg-muted animate-pulse rounded-sm" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded-sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert trip records to TripData for cards
  const allTrips: TripData[] = tripRecords.map((t) => tripRecordToTripData(t, []));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <BudgetBar />
      <div className="flex-1 overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground mb-2">
              Your Trips
            </h2>
            <p className="text-sm font-body text-muted-foreground">
              Click any trip to open the full matrix view.
            </p>
          </div>
          <button
            onClick={() => setNewJourneyOpen(true)}
            className="flex items-center gap-2 bg-forest text-primary-foreground px-5 py-2.5 rounded-sm hover:opacity-90 transition-all font-body text-xs font-medium tracking-wider uppercase"
            style={{ backgroundColor: "hsl(var(--forest))" }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            New Journey
          </button>
        </div>
        {allTrips.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-body text-muted-foreground mb-4">No trips yet. Create your first journey.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {allTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onOpen={() => handleOpenTrip(trip.id)} />
            ))}
          </div>
        )}
      </div>
      </div>
      <NewJourneyModal
        open={newJourneyOpen}
        onOpenChange={setNewJourneyOpen}
        onConfirm={handleNewJourney}
      />
    </div>
  );
}
