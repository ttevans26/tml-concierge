import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTripStore, type ItineraryItem, type TripRecord } from "@/stores/useTripStore";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

/* ── Fetch all trips for user ── */
export function useTrips() {
  const { user } = useAuth();
  const { setTrips, setTripsLoading } = useTripStore();

  const query = useQuery({
    queryKey: ["trips", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data || []) as TripRecord[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (query.data) {
      setTrips(query.data);
      setTripsLoading(false);
    }
  }, [query.data, setTrips, setTripsLoading]);

  return query;
}

/* ── Fetch itinerary items for active trip ── */
export function useItineraryItems(tripId: string | null) {
  const { setItems, setItemsLoading } = useTripStore();

  const query = useQuery({
    queryKey: ["itinerary_items", tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("day_index", { ascending: true });
      if (error) throw error;
      return (data || []) as ItineraryItem[];
    },
    enabled: !!tripId,
  });

  useEffect(() => {
    if (query.data) {
      setItems(query.data);
      setItemsLoading(false);
    }
    if (query.isLoading) {
      setItemsLoading(true);
    }
  }, [query.data, query.isLoading, setItems, setItemsLoading]);

  return query;
}

/* ── Add itinerary item (optimistic) ── */
export function useAddItem() {
  const qc = useQueryClient();
  const { addItem, removeItem } = useTripStore();

  return useMutation({
    mutationFn: async (item: Omit<ItineraryItem, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("itinerary_items")
        .insert(item as any)
        .select()
        .single();
      if (error) throw error;
      return data as ItineraryItem;
    },
    onMutate: (newItem) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: ItineraryItem = {
        ...newItem,
        id: tempId,
        created_at: new Date().toISOString(),
      } as ItineraryItem;
      addItem(optimistic);
      return { tempId };
    },
    onSuccess: (data, _vars, ctx) => {
      if (ctx?.tempId) removeItem(ctx.tempId);
      addItem(data);
      qc.invalidateQueries({ queryKey: ["itinerary_items", data.trip_id] });
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.tempId) removeItem(ctx.tempId);
    },
  });
}

/* ── Update itinerary item (optimistic) ── */
export function useUpdateItem() {
  const qc = useQueryClient();
  const { updateItem, items } = useTripStore();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ItineraryItem> }) => {
      const { data, error } = await supabase
        .from("itinerary_items")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ItineraryItem;
    },
    onMutate: ({ id, updates }) => {
      const previous = items.find((i) => i.id === id);
      updateItem(id, updates);
      return { previous };
    },
    onSuccess: (data) => {
      updateItem(data.id, data);
      qc.invalidateQueries({ queryKey: ["itinerary_items", data.trip_id] });
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.previous) updateItem(id, ctx.previous);
    },
  });
}

/* ── Delete itinerary item (optimistic) ── */
export function useDeleteItem() {
  const qc = useQueryClient();
  const { removeItem, addItem, items } = useTripStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const item = items.find((i) => i.id === id);
      const { error } = await supabase
        .from("itinerary_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { id, tripId: item?.trip_id };
    },
    onMutate: (id) => {
      const previous = items.find((i) => i.id === id);
      removeItem(id);
      return { previous };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["itinerary_items", data.tripId] });
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) addItem(ctx.previous);
    },
  });
}

/* ── Create a new trip ── */
export function useCreateTrip() {
  const qc = useQueryClient();
  const { addTrip } = useTripStore();

  return useMutation({
    mutationFn: async (trip: { user_id: string; title: string; destination: string; start_date: string; end_date: string; target_nightly_budget?: number }) => {
      const { data, error } = await supabase
        .from("trips")
        .insert(trip)
        .select()
        .single();
      if (error) throw error;
      return data as TripRecord;
    },
    onSuccess: (data) => {
      addTrip(data);
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
