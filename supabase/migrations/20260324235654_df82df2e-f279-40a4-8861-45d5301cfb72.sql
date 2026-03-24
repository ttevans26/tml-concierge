
-- Flight tracking table
CREATE TABLE public.flight_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flight_number text NOT NULL,
  airline text,
  departure_airport text,
  arrival_airport text,
  departure_time timestamptz,
  arrival_time timestamptz,
  flight_date date,
  status text DEFAULT 'scheduled',
  gate text,
  terminal text,
  delay_minutes integer DEFAULT 0,
  aircraft_type text,
  notes text,
  last_checked_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.flight_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access flight_tracking"
  ON public.flight_tracking
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Published trip flights readable"
  ON public.flight_tracking
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = flight_tracking.trip_id
    AND trips.is_published = true
  ));
