import type { TripData } from "@/lib/tripTransforms";
import type { ItineraryItem } from "@/stores/useTripStore";

export interface CompletionStatus {
  allNightsCovered: boolean;
  hasFlights: boolean;
  isComplete: boolean;
  coveragePercent: number;
  homelessNights: number[];
  totalNights: number;
  flightCount: number;
}

/**
 * Detects whether a trip itinerary is "complete":
 * - Every night has a Stay card (no homeless nights)
 * - At least one flight/logistics entry exists
 */
export function detectCompletion(trip: TripData): CompletionStatus {
  const stayRow = trip.rows.find((r) => r.type === "stay");
  const logisticsRow = trip.rows.find((r) => r.type === "logistics");

  // Last day is departure, doesn't need a stay
  const totalNights = Math.max(0, trip.days - 1);
  const homelessNights: number[] = [];

  if (stayRow) {
    for (let i = 0; i < totalNights; i++) {
      if (!stayRow.cells[i]) {
        homelessNights.push(i);
      }
    }
  }

  const flightCount = logisticsRow
    ? logisticsRow.cells.filter((c) => c != null).length
    : 0;

  const allNightsCovered = homelessNights.length === 0 && totalNights > 0;
  const hasFlights = flightCount > 0;
  const isComplete = allNightsCovered && hasFlights;
  const coveragePercent = totalNights > 0
    ? Math.round(((totalNights - homelessNights.length) / totalNights) * 100)
    : 0;

  return {
    allNightsCovered,
    hasFlights,
    isComplete,
    coveragePercent,
    homelessNights,
    totalNights,
    flightCount,
  };
}

/** Build trip briefing stats from live items */
export function buildTripBriefing(items: ItineraryItem[], targetRate: number, tripDays: number) {
  const stayItems = items.filter((i) => i.type === "stay" && i.cost != null);
  const totalSpent = stayItems.reduce((sum, i) => sum + (i.cost || 0), 0);
  const nightsBooked = stayItems.length;
  const targetTotal = nightsBooked * targetRate;
  const budgetDelta = targetTotal - totalSpent;

  const deadlines = items.filter(
    (i) => i.cancellation_deadline && new Date(i.cancellation_deadline).getTime() > Date.now()
  );

  // Unique destinations from stay subtitles
  const destinations = new Set<string>();
  stayItems.forEach((i) => {
    if (i.subtitle) {
      const loc = i.subtitle.split("·")[0]?.trim();
      if (loc && !loc.startsWith("Night")) destinations.add(loc);
    }
  });

  return {
    totalSpent,
    nightsBooked,
    budgetDelta,
    isUnderBudget: budgetDelta >= 0,
    deadlineCount: deadlines.length,
    destinationCount: destinations.size,
    destinations: Array.from(destinations),
    tripDays,
  };
}
