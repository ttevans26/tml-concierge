import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface FlightRecord {
  id: string;
  trip_id: string;
  user_id: string;
  flight_number: string;
  airline: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  flight_date: string | null;
  status: string | null;
  gate: string | null;
  terminal: string | null;
  delay_minutes: number | null;
  aircraft_type: string | null;
  notes: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export function useFlightTracking(tripId: string | undefined) {
  return useQuery({
    queryKey: ["flight_tracking", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from("flight_tracking")
        .select("*")
        .eq("trip_id", tripId)
        .order("flight_date", { ascending: true });
      if (error) throw error;
      return (data || []) as FlightRecord[];
    },
    enabled: !!tripId,
  });
}

export function useAddFlight() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (flight: Omit<FlightRecord, "id" | "created_at" | "last_checked_at" | "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("flight_tracking")
        .insert({ ...flight, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["flight_tracking", data.trip_id] });
    },
  });
}

/** Looks up flight via edge function, then saves to flight_tracking */
export function useLookupAndAddFlight() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ flightNumber, date, tripId }: { flightNumber: string; date?: string; tripId: string }) => {
      if (!user) throw new Error("Not authenticated");

      // 1. Call edge function for live data
      const { data: lookupData, error: lookupError } = await supabase.functions.invoke("flight-lookup", {
        body: { flightNumber, date },
      });

      if (lookupError) throw new Error(lookupError.message || "Flight lookup failed");
      if (!lookupData?.success) throw new Error(lookupData?.error || "Flight not found");

      const f = lookupData.flight;

      // 2. Save enriched record to DB
      const record = {
        trip_id: tripId,
        user_id: user.id,
        flight_number: f.flightNumber,
        airline: f.airline || null,
        departure_airport: f.departureAirport || null,
        arrival_airport: f.arrivalAirport || null,
        departure_time: f.departureTime || null,
        arrival_time: f.arrivalTime || null,
        flight_date: date || null,
        status: f.status || "scheduled",
        gate: null,
        terminal: null,
        delay_minutes: 0,
        aircraft_type: null,
        notes: null,
      };

      const { data, error } = await supabase
        .from("flight_tracking")
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["flight_tracking", data.trip_id] });
    },
  });
}

export function useUpdateFlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FlightRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from("flight_tracking")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["flight_tracking", data.trip_id] });
    },
  });
}
