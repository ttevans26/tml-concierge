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
