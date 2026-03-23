import { useState, useCallback } from "react";
import { MapPin, ArrowLeft, Info, EyeOff, Plane, Car, Hotel, Utensils, Clock, Plus, Upload, Sparkles, Check, Share2, LayoutGrid, Calendar, Settings2, Trash2, AlertTriangle } from "lucide-react";
import NewJourneyModal from "@/components/NewJourneyModal";
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

/* ── Trip Data ── */
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

interface TripData {
  id: string;
  destination: string;
  dates: string;
  days: number;
  dayLabels: string[];
  rows: {
    label: string;
    type: "logistics" | "stay" | "agenda" | "dining";
    icon: typeof Plane;
    cells: (Booking | null)[];
  }[];
}

function genDayLabels(startDate: string, count: number): string[] {
  const labels: string[] = [];
  const start = new Date(startDate);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    labels.push(`Day ${i + 1} — ${months[d.getMonth()]} ${d.getDate()}`);
  }
  return labels;
}

const trips: TripData[] = [
  {
    id: "europe-2026",
    destination: "Europe Grand Tour",
    dates: "Aug 21 – Sep 17, 2026",
    days: 28,
    dayLabels: genDayLabels("2026-08-21", 28),
    rows: [
      {
        label: "Logistics",
        type: "logistics",
        icon: Plane,
        cells: (() => {
          const c: (Booking | null)[] = Array(28).fill(null);
          // Day 4 (Aug 24): arrive Bath (no major logistics)
          c[5] = { title: "Eurostar → Paris", subtitle: "1st Class · St Pancras", time: "7:01 AM → 10:17 AM", proTip: "✦ Use CSR for 3x transit." };
          c[7] = { title: "TGV Paris → Avignon", subtitle: "1st Class · Gare de Lyon", time: "8:12 AM → 11:00 AM", proTip: "✦ Use CSR for 3x transit." };
          c[11] = { title: "Train St-Rémy → Antibes", subtitle: "TER via Avignon", time: "9:30 AM → 1:15 PM", proTip: "✦ Use CSR for 3x transit." };
          c[16] = { title: "Flight NCE → VRN", subtitle: "easyJet · EZY4519", confirmation: "EZY-7R42K", time: "2:30 PM → 4:00 PM", proTip: "✦ Use Amex Platinum for 5x flights." };
          c[27] = { title: "Transfer → MXP", subtitle: "Private car to Malpensa", time: "10:00 AM", proTip: "✦ Departure leg." };
          return c;
        })(),
      },
      {
        label: "Stay",
        type: "stay",
        icon: Hotel,
        cells: (() => {
          const c: (Booking | null)[] = Array(28).fill(null);
          // Queens Arms: Aug 21-24 (nights 0,1,2 = 3 nights)
          c[0] = { title: "Queens Arms", subtitle: "Sherborne, Dorset", confirmation: "QA-2108", price: "$185/night" };
          c[1] = { title: "Queens Arms", subtitle: "Night 2 of 3" };
          c[2] = { title: "Queens Arms", subtitle: "Night 3 of 3" };
          // Roseate Villa: Aug 24-26 (nights 3,4 = 2 nights)
          c[3] = { title: "Roseate Villa", subtitle: "Bath · Garden Suite", confirmation: "RV-4421", price: "$310/night", cancellationDeadline: "2026-08-20T23:59:00", cancellationLabel: "Aug 20, 2026" };
          c[4] = { title: "Roseate Villa", subtitle: "Night 2 of 2" };
          // Hotel L'Ormaie: Aug 26-28 (nights 5,6 = 2 nights)
          c[5] = { title: "Hotel L'Ormaie", subtitle: "Paris · Saint-Germain", confirmation: "LO-6633", price: "$420/night", amexFHR: true, cancellationDeadline: "2026-08-22T23:59:00", cancellationLabel: "Aug 22, 2026", proTip: "✦ Book via Amex FHR for 5x + $200 credit." };
          c[6] = { title: "Hotel L'Ormaie", subtitle: "Night 2 of 2" };
          // Hotel Sous les Figuiers: Aug 28 – Sep 1 (nights 7-10 = 4 nights)
          c[7] = { title: "Hotel Sous les Figuiers", subtitle: "St-Rémy-de-Provence", confirmation: "SLF-1192", price: "$375/night", status: "paid", proTip: "✦ Under target — +$100 splurge credit." };
          c[8] = { title: "Hotel Sous les Figuiers", subtitle: "Night 2 of 4", status: "paid" };
          c[9] = { title: "Hotel Sous les Figuiers", subtitle: "Night 3 of 4", status: "paid" };
          c[10] = { title: "Hotel Sous les Figuiers", subtitle: "Night 4 of 4", status: "paid" };
          // La Villa Port d'Antibes: Sep 1-6 (nights 11-15 = 5 nights)
          c[11] = { title: "La Villa Port d'Antibes", subtitle: "Antibes · Sea View", confirmation: "LVA-8830", price: "$350/night", status: "paid" };
          c[12] = { title: "La Villa Port d'Antibes", subtitle: "Night 2 of 5", status: "paid" };
          c[13] = { title: "La Villa Port d'Antibes", subtitle: "Night 3 of 5", status: "paid" };
          c[14] = { title: "La Villa Port d'Antibes", subtitle: "Night 4 of 5", status: "paid" };
          c[15] = { title: "La Villa Port d'Antibes", subtitle: "Night 5 of 5", status: "paid" };
          // Hotel Accademia: Sep 6-8 (nights 16,17 = 2 nights)
          c[16] = { title: "Hotel Accademia", subtitle: "Verona · Centro Storico", confirmation: "HA-5547", price: "$280/night", status: "hold", cancellationDeadline: "2026-09-02T23:59:00", cancellationLabel: "Sep 2, 2026" };
          c[17] = { title: "Hotel Accademia", subtitle: "Night 2 of 2", status: "hold" };
          // Adler Spa Resort: Sep 8-12 (nights 18-21 = 4 nights)
          c[18] = { title: "Adler Spa Resort", subtitle: "Dolomites · Spa & Wellness · Sauna · Gym", confirmation: "ADL-9910", price: "$620/night", prefMatch: true, cancellationDeadline: "2026-09-04T23:59:00", cancellationLabel: "Sep 4, 2026", proTip: "✦ Funded by splurge credit from St-Rémy savings." };
          c[19] = { title: "Adler Spa Resort", subtitle: "Night 2 of 4 · Spa · Sauna", prefMatch: true };
          c[20] = { title: "Adler Spa Resort", subtitle: "Night 3 of 4", prefMatch: true };
          c[21] = { title: "Adler Spa Resort", subtitle: "Night 4 of 4", prefMatch: true };
          // Hotel Bella Riva: Sep 12-16 (nights 22-25 = 4 nights)
          c[22] = { title: "Hotel Bella Riva", subtitle: "Garda · Lakefront · Fitness · Sauna", confirmation: "HBR-3316", price: "$290/night", status: "hold", prefMatch: true };
          c[23] = { title: "Hotel Bella Riva", subtitle: "Night 2 of 4 · Sauna", status: "hold", prefMatch: true };
          c[24] = { title: "Hotel Bella Riva", subtitle: "Night 3 of 4", status: "hold", prefMatch: true };
          c[25] = { title: "Hotel Bella Riva", subtitle: "Night 4 of 4", status: "hold", prefMatch: true };
          // Sempione Boutique Hotel: Sep 16-17 (night 26 = 1 night)
          c[26] = { title: "Sempione Boutique Hotel", subtitle: "Stresa, Lake Maggiore", confirmation: "SBH-7704", price: "$195/night" };
          // Day 28 (Sep 17): Departure
          c[27] = null;
          return c;
        })(),
      },
      {
        label: "Agenda",
        type: "agenda",
        icon: MapPin,
        cells: (() => {
          const c: (Booking | null)[] = Array(28).fill(null);
          c[0] = { title: "Arrive Sherborne", subtitle: "Settle in, village walk", time: "3:00 PM" };
          c[1] = { title: "Sherborne Abbey & Castle", subtitle: "Village exploration", time: "10:00 AM" };
          c[3] = { title: "Roman Baths & Royal Crescent", subtitle: "Bath city tour", time: "10:00 AM" };
          c[5] = { title: "Musée d'Orsay", subtitle: "Impressionists collection", time: "10:30 AM" };
          c[6] = { title: "Le Marais Walking Tour", subtitle: "Guided neighborhood walk", time: "2:00 PM" };
          c[8] = { title: "Les Baux-de-Provence", subtitle: "Hilltop village day trip", time: "10:00 AM" };
          c[9] = { title: "Pont du Gard", subtitle: "Roman aqueduct excursion", time: "9:00 AM" };
          c[12] = { title: "Antibes Old Town", subtitle: "Marché Provençal & Picasso Museum", time: "10:00 AM" };
          c[16] = { title: "Arena di Verona", subtitle: "Evening opera performance", time: "8:00 PM" };
          c[18] = { title: "Dolomites Hike — Seceda", subtitle: "Guided alpine trail", time: "8:00 AM" };
          c[20] = { title: "Alpe di Siusi", subtitle: "Meadow walk & cable car", time: "9:30 AM" };
          c[22] = { title: "Sirmione Castle", subtitle: "Scaligero Castle & thermal baths", time: "10:00 AM" };
          c[26] = { title: "Borromean Islands", subtitle: "Boat tour from Stresa", time: "9:00 AM" };
          c[27] = { title: "Departure", subtitle: "Transfer to MXP Airport", time: "10:00 AM" };
          return c;
        })(),
      },
      {
        label: "Dining",
        type: "dining",
        icon: Utensils,
        cells: (() => {
          const c: (Booking | null)[] = Array(28).fill(null);
          c[0] = { title: "Queens Arms Pub Dinner", subtitle: "Local gastropub", time: "7:30 PM" };
          c[3] = { title: "The Pump Room", subtitle: "Afternoon tea, Bath", time: "3:00 PM" };
          c[5] = { title: "Le Comptoir du Panthéon", subtitle: "French bistro", time: "8:00 PM" };
          c[8] = { title: "La Table de Marius", subtitle: "Provençal cuisine, St-Rémy", time: "8:30 PM" };
          c[12] = { title: "Le Figuier de St-Esprit", subtitle: "Michelin-starred, Antibes", time: "8:00 PM", proTip: "✦ Use CSR for 3x dining." };
          c[16] = { title: "Osteria Mondodoro", subtitle: "Traditional Veronese", time: "7:30 PM" };
          c[18] = { title: "Adler Spa Half-Board", subtitle: "Included fine dining", time: "7:00 PM" };
          c[22] = { title: "Ristorante Lido 84", subtitle: "Lakeside tasting menu, Gardone", time: "8:00 PM", proTip: "✦ Use CSR for 3x dining." };
          c[26] = { title: "Trattoria del Pesce", subtitle: "Lake Maggiore seafood", time: "8:00 PM" };
          return c;
        })(),
      },
    ],
  },
];

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

/* ── Points Automation (Profile-aware) ── */
function CardPointsTip({ cell, row }: { cell: Booking; row: { type: string } }) {
  const { getBestCard } = useProfile();
  const typeMap: Record<string, "flight" | "stay" | "dining" | "transit" | "site"> = {
    logistics: "flight",
    stay: "stay",
    dining: "dining",
    agenda: "site",
  };
  const cardType = typeMap[row.type] || "stay";
  const bestCard = getBestCard(cardType);
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
  const [viewMode, setViewMode] = useState<"matrix" | "calendar">("matrix");
  const [pendingAnchor, setPendingAnchor] = useState<{ label: string; nightlyRate: number; nights: number } | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [insertDialog, setInsertDialog] = useState<{ dayIdx: number; dayLabel: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ dayIdx: number; dayLabel: string; cards: { type: string; title: string }[]; conflicts: string[] } | null>(null);
  const [locationSwap, setLocationSwap] = useState<{ dayIdx: number; oldLocation: string; newLocation: string; irrelevant: { type: string; title: string; reason: string }[] } | null>(null);
  const [editingLocation, setEditingLocation] = useState<{ dayIdx: number; value: string } | null>(null);
  const [locationMismatches, setLocationMismatches] = useState<Set<number>>(new Set());

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
    const start = new Date("2026-08-21");
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

  return (
    <div className="h-full flex flex-col">
      <BudgetBar pendingAnchor={pendingAnchor} />
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
            {trip.dates} · Matrix View
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
          </div>
          <button
            onClick={() => setFlightOpen(true)}
            className="flex items-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-forest border border-forest/30 rounded-sm px-3 py-1.5 hover:bg-forest/5 transition-colors"
          >
            <Plane className="w-3 h-3" strokeWidth={1.5} />
            Add Flight
          </button>
          <button
            onClick={() => setCsvOpen(true)}
            className="flex items-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground border border-border rounded-sm px-3 py-1.5 hover:bg-muted/30 transition-colors"
            title="Admin: Bulk CSV Import"
          >
            <Upload className="w-3 h-3" strokeWidth={1.5} />
            CSV
          </button>
        </div>
      </div>

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
        />
      ) : (
      <>
      {/* Matrix */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Column headers with Gap Detection */}
          <div className="flex border-b border-border sticky top-0 bg-background z-10">
            <div className="w-32 shrink-0 px-4 py-3 border-r border-border" />
            {trip.dayLabels.map((label, dayIdx) => {
              const stayRow = trip.rows.find((r) => r.type === "stay");
              const logisticsRow = trip.rows.find((r) => r.type === "logistics");
              const hasStay = stayRow?.cells[dayIdx] != null;
              const hasLogistics = logisticsRow?.cells[dayIdx] != null;
              const hasGap = !hasStay && !hasLogistics;
              return (
                <div
                  key={label}
                  data-day-idx={dayIdx}
                  className={cn(
                    "w-64 shrink-0 px-4 py-3 border-r border-border text-[11px] font-body font-medium uppercase tracking-widest",
                    hasGap ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30" : "text-muted-foreground"
                  )}
                >
                  {label}
                  {hasGap && (
                    <span className="block text-[9px] font-body font-bold tracking-widest text-amber-600 mt-0.5 normal-case">
                      Empty Slot
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {trip.rows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex border-b border-border">
                {/* Row label */}
                <div className="w-32 shrink-0 px-4 py-4 border-r border-border flex items-center gap-2">
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
                        "w-64 shrink-0 px-3 py-3 border-r border-border",
                        isClickable && "cursor-pointer hover:bg-muted/20 transition-colors"
                      )}
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
                        <div className={cn(
                          "border rounded-sm p-3 bg-background hover:shadow-sm transition-shadow relative",
                          cell.status === "hold" ? "border-amber-500/50" : cell.status === "paid" ? "border-forest/40" : "border-border"
                        )}>
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
                        <div
                          className={cn(
                            "border border-dashed rounded-sm py-6 flex items-center justify-center text-[10px] font-body text-muted-foreground transition-colors",
                            isDragOver ? "border-forest bg-forest/5 text-forest" : "border-border"
                          )}
                        >
                          {isDragOver ? "Drop here" : isHoveredEmpty ? (
                            <Plus className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                          ) : "—"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      </>
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
          initialDate={(() => { const d = new Date("2026-08-21"); d.setDate(d.getDate() + logisticsPanel.dayIdx); return d; })()}
          onAdd={handleLogisticsAdd}
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
  const [openTrip, setOpenTrip] = useState<TripData | null>(null);
  const [allTrips, setAllTrips] = useState<TripData[]>(trips);
  const [newJourneyOpen, setNewJourneyOpen] = useState(false);

  const handleNewJourney = (journey: { destination: string; startDate: Date; endDate: Date; days: number }) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const startLabel = `${months[journey.startDate.getMonth()]} ${journey.startDate.getDate()}`;
    const endLabel = `${months[journey.endDate.getMonth()]} ${journey.endDate.getDate()}, ${journey.endDate.getFullYear()}`;

    const dayLabels: string[] = [];
    for (let i = 0; i < journey.days; i++) {
      const d = new Date(journey.startDate);
      d.setDate(d.getDate() + i);
      dayLabels.push(`Day ${i + 1} — ${months[d.getMonth()]} ${d.getDate()}`);
    }

    // Build blank cells — mark Day 1 and Final Day as transit days
    const blankCells = Array(journey.days).fill(null);
    const logisticsCells = [...blankCells];
    logisticsCells[0] = { title: "Arrival Transit", subtitle: "Book your inbound flight", status: "pending" as const };
    logisticsCells[journey.days - 1] = { title: "Departure Transit", subtitle: "Book your return flight", status: "pending" as const };

    const newTrip: TripData = {
      id: `trip-${Date.now()}`,
      destination: journey.destination,
      dates: `${startLabel} – ${endLabel}`,
      days: journey.days,
      dayLabels,
      rows: [
        { label: "Logistics", type: "logistics", icon: Plane, cells: logisticsCells },
        { label: "Stay", type: "stay", icon: Hotel, cells: [...blankCells] },
        { label: "Agenda", type: "agenda", icon: MapPin, cells: [...blankCells] },
        { label: "Dining", type: "dining", icon: Utensils, cells: [...blankCells] },
      ],
    };

    setAllTrips((prev) => [newTrip, ...prev]);
    setOpenTrip(newTrip);
  };

  if (openTrip) {
    return <MatrixView trip={openTrip} onBack={() => setOpenTrip(null)} />;
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {allTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onOpen={() => setOpenTrip(trip)} />
          ))}
        </div>
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
