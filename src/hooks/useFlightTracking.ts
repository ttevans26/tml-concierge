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

/** Looks up flight via AviationStack API (CORS proxy), then saves to flight_tracking */
export function useLookupAndAddFlight() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ flightNumber, date, tripId }: { flightNumber: string; date?: string; tripId: string }) => {
      if (!user) throw new Error("Not authenticated");

      const apiKey = import.meta.env.VITE_AVIATION_API_KEY;
      if (!apiKey) throw new Error("Aviation API key not configured");

      const iata = flightNumber.toUpperCase().replace(/\s/g, "");
      const targetUrl = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${iata}`;
      const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(targetUrl);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      let f: { airline?: string; dep?: string; arr?: string; depTime?: string; arrTime?: string; status?: string; terminal?: string; gate?: string } = {};

      try {
        const res = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error("API request failed");
        const json = await res.json();
        const flight = json?.data?.[0];
        if (flight) {
          f = {
            airline: flight.airline?.name || null,
            dep: flight.departure?.iata || null,
            arr: flight.arrival?.iata || null,
            depTime: flight.departure?.scheduled || null,
            arrTime: flight.arrival?.scheduled || null,
            status: flight.flight_status || "scheduled",
            terminal: flight.departure?.terminal || null,
            gate: flight.departure?.gate || null,
          };
        } else {
          throw new Error("Flight not found");
        }
      } catch {
        clearTimeout(timeout);
        throw new Error("Live fetch unavailable");
      }

      const record = {
        trip_id: tripId,
        user_id: user.id,
        flight_number: iata,
        airline: f.airline || null,
        departure_airport: f.dep || null,
        arrival_airport: f.arr || null,
        departure_time: f.depTime || null,
        arrival_time: f.arrTime || null,
        flight_date: date || null,
        status: f.status || "scheduled",
        gate: f.gate || null,
        terminal: f.terminal || null,
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
