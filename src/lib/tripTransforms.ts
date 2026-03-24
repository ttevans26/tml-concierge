import { Plane, Car, Hotel, MapPin, Utensils } from "lucide-react";
import type { ItineraryItem, TripRecord } from "@/stores/useTripStore";

export interface Booking {
  id?: string; // DB id for mutations
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

export interface TripData {
  id: string;
  destination: string;
  dates: string;
  days: number;
  dayLabels: string[];
  startDate: string;
  rows: {
    label: string;
    type: "logistics" | "stay" | "agenda" | "dining";
    icon: typeof Plane;
    cells: (Booking | null)[];
  }[];
}

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function genDayLabels(startDate: string, count: number): string[] {
  const labels: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    labels.push(`Day ${i + 1} — ${months[d.getMonth()]} ${d.getDate()}`);
  }
  return labels;
}

export function tripRecordToTripData(trip: TripRecord, items: ItineraryItem[]): TripData {
  const startDate = trip.start_date || "2026-08-21";
  const endDate = trip.end_date || "2026-09-17";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const dayLabels = genDayLabels(startDate, days);

  const startLabel = `${months[start.getMonth()]} ${start.getDate()}`;
  const endLabel = `${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  const dates = `${startLabel} – ${endLabel}`;

  // Build empty rows
  const rows: TripData["rows"] = [
    { label: "Logistics", type: "logistics", icon: Plane, cells: Array(days).fill(null) },
    { label: "Stay", type: "stay", icon: Hotel, cells: Array(days).fill(null) },
    { label: "Agenda", type: "agenda", icon: MapPin, cells: Array(days).fill(null) },
    { label: "Dining", type: "dining", icon: Utensils, cells: Array(days).fill(null) },
  ];

  // Map items to cells
  for (const item of items) {
    const dayIdx = item.day_index;
    if (dayIdx == null || dayIdx < 0 || dayIdx >= days) continue;

    const rowType = item.type === "flight" ? "logistics" : item.type;
    const row = rows.find((r) => r.type === rowType);
    if (!row) continue;

    const cancellationLabel = item.cancellation_deadline
      ? formatCancellationLabel(item.cancellation_deadline)
      : undefined;

    const booking: Booking = {
      id: item.id,
      title: item.title || "",
      subtitle: item.subtitle || "",
      confirmation: item.confirmation_code || undefined,
      price: item.cost != null ? `$${item.cost}/night` : undefined,
      time: item.time_label || undefined,
      cancellationDeadline: item.cancellation_deadline || undefined,
      cancellationLabel,
      proTip: item.pro_tip || undefined,
      amexFHR: item.amex_fhr || undefined,
      status: (item.payment_status as Booking["status"]) || undefined,
      prefMatch: item.pref_match || undefined,
    };

    row.cells[dayIdx] = booking;
  }

  return {
    id: trip.id,
    destination: trip.title || trip.destination || "Untitled Trip",
    dates,
    days,
    dayLabels,
    startDate,
    rows,
  };
}

function formatCancellationLabel(deadline: string): string {
  const d = new Date(deadline);
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Compute budget stats from live items */
export function computeBudgetFromItems(items: ItineraryItem[], targetRate: number) {
  const stayItems = items.filter((i) => i.type === "stay" && i.cost != null);
  const totalSpent = stayItems.reduce((sum, i) => sum + (i.cost || 0), 0);
  const nightsBooked = stayItems.length;
  const targetTotal = nightsBooked * targetRate;
  const splurgeCredit = targetTotal - totalSpent;

  return { totalSpent, nightsBooked, splurgeCredit };
}
