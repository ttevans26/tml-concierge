import { useState } from "react";
import { MapPin, ArrowLeft, Info, EyeOff, Plane, Car, Hotel, Utensils, Clock, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import BudgetBar from "@/components/BudgetBar";
import FlightIngestor from "@/components/FlightIngestor";
import CsvImporter from "@/components/CsvImporter";

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

const trips: TripData[] = [
  {
    id: "venice-2026",
    destination: "Venice, Italy",
    dates: "Sep 6–8, 2026",
    days: 3,
    dayLabels: ["Day 1 — Sep 6", "Day 2 — Sep 7", "Day 3 — Sep 8"],
    rows: [
      {
        label: "Logistics",
        type: "logistics",
        icon: Car,
        cells: [
          {
            title: "Hertz — VCE Airport",
            subtitle: "Full-size SUV, GPS included",
            confirmation: "HZ-991-VCE",
            price: "$342",
            time: "10:00 AM Pickup",
            cancellationDeadline: "2026-09-04T12:00:00",
            cancellationLabel: "Sep 4, 2026 at Noon",
            proTip: "✦ Use Chase Sapphire Reserve for 3x points on travel.",
          },
          null,
          {
            title: "Hertz — VCE Return",
            subtitle: "Drop-off by 6 PM",
            time: "6:00 PM",
          },
        ],
      },
      {
        label: "Stay",
        type: "stay",
        icon: Hotel,
        cells: [
          {
            title: "Hotel Danieli",
            subtitle: "Luxury Collection · Lagoon View Suite",
            confirmation: "HD-7721-VE",
            price: "$890/night",
            amexFHR: true,
            cancellationDeadline: "2026-09-01T23:59:00",
            cancellationLabel: "Sep 1, 2026",
            proTip: "✦ Book via Amex Travel for 5x points + FHR Credits.",
          },
          {
            title: "Hotel Danieli",
            subtitle: "Night 2 of 2",
            amexFHR: true,
          },
          null,
        ],
      },
      {
        label: "Agenda",
        type: "agenda",
        icon: MapPin,
        cells: [
          {
            title: "Water Taxi to San Marco",
            subtitle: "Private transfer from VCE",
            time: "12:00 PM",
          },
          {
            title: "Peggy Guggenheim Collection",
            subtitle: "Modern art on the Grand Canal",
            time: "10:00 AM",
          },
          {
            title: "Murano Glass Factory Tour",
            subtitle: "Private demonstration",
            time: "9:00 AM",
          },
        ],
      },
      {
        label: "Dining",
        type: "dining",
        icon: Utensils,
        cells: [
          {
            title: "Harry's Bar",
            subtitle: "Bellini & Carpaccio",
            time: "8:00 PM",
            proTip: "✦ Use Chase Sapphire Reserve for 3x points on dining.",
          },
          {
            title: "Ristorante Quadri",
            subtitle: "Alajmo Group · St. Mark's Square",
            time: "8:30 PM",
            proTip: "✦ Use Chase Sapphire Reserve for 3x points on dining.",
          },
          null,
        ],
      },
    ],
  },
  {
    id: "japan-2026",
    destination: "Nozawaonsen, Japan",
    dates: "Jan 12–15, 2026",
    days: 4,
    dayLabels: ["Day 1 — Jan 12", "Day 2 — Jan 13", "Day 3 — Jan 14", "Day 4 — Jan 15"],
    rows: [
      {
        label: "Logistics",
        type: "logistics",
        icon: Plane,
        cells: [
          {
            title: "Delta DL-178 — LAX → NRT",
            subtitle: "Delta One Suite",
            confirmation: "DL7X9K2M",
            price: "85,000 SkyMiles",
            cancellationDeadline: "2026-01-10T23:59:00",
            cancellationLabel: "Jan 10, 2026",
            proTip: "✦ Use Amex Platinum for 5x points.",
          },
          null,
          null,
          {
            title: "Delta DL-179 — NRT → LAX",
            subtitle: "Delta One Suite, Return",
            confirmation: "DL7X9K2R",
          },
        ],
      },
      {
        label: "Stay",
        type: "stay",
        icon: Hotel,
        cells: [
          {
            title: "Ryokan Sakaya",
            subtitle: "Traditional hot spring ryokan",
            confirmation: "RYK-8842-NZ",
            price: "45,000 Bonvoy",
            amexFHR: true,
            cancellationDeadline: "2026-01-05T23:59:00",
            cancellationLabel: "Jan 5, 2026",
            proTip: "✦ Book via Amex Travel for 5x points + FHR Credits.",
          },
          { title: "Ryokan Sakaya", subtitle: "Night 2" },
          { title: "Ryokan Sakaya", subtitle: "Night 3" },
          null,
        ],
      },
      {
        label: "Agenda",
        type: "agenda",
        icon: MapPin,
        cells: [
          { title: "Arrival & Onsen", subtitle: "Check-in & hot springs", time: "4:00 PM" },
          { title: "Ski Day — Nozawa Onsen Resort", subtitle: "Full day on slopes", time: "8:30 AM" },
          { title: "Village Walking Tour", subtitle: "Guided cultural walk", time: "10:00 AM" },
          { title: "Departure Morning", subtitle: "Shinkansen to Tokyo", time: "9:00 AM" },
        ],
      },
      {
        label: "Dining",
        type: "dining",
        icon: Utensils,
        cells: [
          { title: "Kaiseki Dinner", subtitle: "Half-board included", time: "7:00 PM" },
          { title: "Kaiseki Dinner", subtitle: "Night 2", time: "7:00 PM" },
          { title: "Local Izakaya", subtitle: "Chef's recommendation", time: "7:30 PM" },
          null,
        ],
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

/* ── Components ── */

function TripCard({ trip, onOpen }: { trip: TripData; onOpen: () => void }) {
  return (
    <div
      onDoubleClick={onOpen}
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
        Double-click to open matrix view
      </p>
    </div>
  );
}

function MatrixView({ trip: initialTrip, onBack, isShared }: { trip: TripData; onBack: () => void; isShared?: boolean }) {
  const [trip, setTrip] = useState<TripData>(initialTrip);
  const [hoveredDeadline, setHoveredDeadline] = useState<string | null>(null);
  const [flightOpen, setFlightOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
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

      {/* Matrix */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Column headers */}
          <div className="flex border-b border-border sticky top-0 bg-background z-10">
            <div className="w-32 shrink-0 px-4 py-3 border-r border-border" />
            {trip.dayLabels.map((label) => (
              <div
                key={label}
                className="w-64 shrink-0 px-4 py-3 border-r border-border text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground"
              >
                {label}
              </div>
            ))}
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
                  return (
                    <div
                      key={idx}
                      className="w-64 shrink-0 px-3 py-3 border-r border-border"
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
                        <div className="border border-border rounded-sm p-3 bg-background hover:shadow-sm transition-shadow relative">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-body font-medium text-foreground truncate pr-2">
                              {cell.title}
                            </span>
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
                            <p className="mt-2 text-[10px] font-body font-medium text-forest">
                              {cell.proTip}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "border border-dashed rounded-sm py-6 flex items-center justify-center text-[10px] font-body text-muted-foreground transition-colors",
                            isDragOver ? "border-forest bg-forest/5 text-forest" : "border-border"
                          )}
                        >
                          {isDragOver ? "Drop here" : "—"}
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

      <FlightIngestor open={flightOpen} onOpenChange={setFlightOpen} onFlightAdd={handleFlightAdd} />
      <CsvImporter open={csvOpen} onOpenChange={setCsvOpen} onImport={handleCsvImport} />
    </div>
  );
}

export default function Trips() {
  const [openTrip, setOpenTrip] = useState<TripData | null>(null);

  if (openTrip) {
    return <MatrixView trip={openTrip} onBack={() => setOpenTrip(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <BudgetBar />
      <div className="flex-1 overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl font-medium tracking-tight text-foreground mb-2">
          Your Trips
        </h2>
        <p className="text-sm font-body text-muted-foreground mb-8">
          Double-click any trip to open the full matrix view.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onOpen={() => setOpenTrip(trip)} />
          ))}
        </div>
      </div>
    </div>
  );
}
