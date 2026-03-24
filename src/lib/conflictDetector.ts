import type { TripData, Booking } from "@/lib/tripTransforms";

export interface HomelessNight {
  dayIdx: number;
  hasActivity: boolean; // dining or agenda but no stay
}

export interface TimeConflict {
  dayIdx: number;
  itemA: string;
  itemB: string;
}

/** Detect days with dining/agenda but no stay and no logistics (transit day) */
export function detectHomelessNights(trip: TripData): HomelessNight[] {
  const stayRow = trip.rows.find((r) => r.type === "stay");
  const diningRow = trip.rows.find((r) => r.type === "dining");
  const agendaRow = trip.rows.find((r) => r.type === "agenda");
  const logisticsRow = trip.rows.find((r) => r.type === "logistics");
  if (!stayRow) return [];

  const alerts: HomelessNight[] = [];
  for (let i = 0; i < trip.days; i++) {
    const hasStay = stayRow.cells[i] != null;
    const hasLogistics = logisticsRow?.cells[i] != null;
    const hasDining = diningRow?.cells[i] != null;
    const hasAgenda = agendaRow?.cells[i] != null;
    if (!hasStay && !hasLogistics && (hasDining || hasAgenda)) {
      alerts.push({ dayIdx: i, hasActivity: true });
    }
  }
  return alerts;
}

/** Parse time like "7:01 AM" or "14:30" to minutes since midnight */
function parseTime(t: string): number | null {
  // Try HH:MM format
  const m24 = t.match(/(\d{1,2}):(\d{2})/);
  if (!m24) return null;
  let hours = parseInt(m24[1]);
  const mins = parseInt(m24[2]);
  // Check AM/PM
  if (/pm/i.test(t) && hours < 12) hours += 12;
  if (/am/i.test(t) && hours === 12) hours = 0;
  return hours * 60 + mins;
}

/** Detect logistics items on the same day with overlapping times */
export function detectTimeConflicts(trip: TripData): TimeConflict[] {
  const logisticsRow = trip.rows.find((r) => r.type === "logistics");
  if (!logisticsRow) return [];

  const conflicts: TimeConflict[] = [];
  // Group logistics by day (currently one cell per day, but check time overlaps with adjacent)
  for (let i = 0; i < trip.days - 1; i++) {
    const cellA = logisticsRow.cells[i];
    const cellB = logisticsRow.cells[i + 1];
    if (!cellA?.time || !cellB?.time) continue;

    // Parse arrival of A and departure of B
    const timeParts = cellA.time.split("→").map((s) => s.trim());
    if (timeParts.length < 2) continue;
    const arrivalA = parseTime(timeParts[1]);

    const timeParts2 = cellB.time.split("→").map((s) => s.trim());
    const departureB = parseTime(timeParts2[0]);

    if (arrivalA != null && departureB != null && arrivalA > departureB) {
      conflicts.push({ dayIdx: i, itemA: cellA.title, itemB: cellB.title });
    }
  }
  return conflicts;
}

/** Check if a specific day is a homeless night */
export function isDayHomeless(homelessNights: HomelessNight[], dayIdx: number): boolean {
  return homelessNights.some((h) => h.dayIdx === dayIdx);
}

/** Check if a logistics item on a day has a time conflict */
export function hasDayConflict(conflicts: TimeConflict[], dayIdx: number): TimeConflict | undefined {
  return conflicts.find((c) => c.dayIdx === dayIdx || c.dayIdx === dayIdx - 1);
}
