import { create } from "zustand";

export interface ItineraryItem {
  id: string;
  trip_id: string;
  type: "stay" | "flight" | "dining" | "logistics" | "agenda";
  title: string | null;
  subtitle: string | null;
  date: string | null;
  day_index: number | null;
  cost: number | null;
  points_used: number | null;
  confirmation_code: string | null;
  cancellation_deadline: string | null;
  payment_status: string | null;
  latitude: number | null;
  longitude: number | null;
  time_label: string | null;
  pro_tip: string | null;
  amex_fhr: boolean;
  pref_match: boolean;
  created_at: string;
}

export interface TripRecord {
  id: string;
  user_id: string;
  title: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  target_nightly_budget: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface TripStore {
  // Active trip
  activeTrip: TripRecord | null;
  setActiveTrip: (trip: TripRecord | null) => void;

  // All user trips
  trips: TripRecord[];
  setTrips: (trips: TripRecord[]) => void;
  addTrip: (trip: TripRecord) => void;

  // Itinerary items for active trip
  items: ItineraryItem[];
  setItems: (items: ItineraryItem[]) => void;
  addItem: (item: ItineraryItem) => void;
  updateItem: (id: string, updates: Partial<ItineraryItem>) => void;
  removeItem: (id: string) => void;

  // Loading states
  tripsLoading: boolean;
  setTripsLoading: (v: boolean) => void;
  itemsLoading: boolean;
  setItemsLoading: (v: boolean) => void;
}

export const useTripStore = create<TripStore>((set) => ({
  activeTrip: null,
  setActiveTrip: (trip) => set({ activeTrip: trip }),

  trips: [],
  setTrips: (trips) => set({ trips }),
  addTrip: (trip) => set((s) => ({ trips: [trip, ...s.trips] })),

  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (id, updates) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  tripsLoading: true,
  setTripsLoading: (v) => set({ tripsLoading: v }),
  itemsLoading: false,
  setItemsLoading: (v) => set({ itemsLoading: v }),
}));
