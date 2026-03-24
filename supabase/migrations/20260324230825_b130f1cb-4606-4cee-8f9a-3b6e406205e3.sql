
-- 1. Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  travel_preferences jsonb DEFAULT '{"adultsOnly": false, "saunaGym": true, "spa": true, "targetNightlyRate": 400}'::jsonb,
  active_cards jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 2. Trips table
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  destination text,
  start_date date,
  end_date date,
  target_nightly_budget numeric DEFAULT 400,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access trips" ON public.trips FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Published trips readable" ON public.trips FOR SELECT USING (is_published = true);

-- 3. Itinerary items table
CREATE TABLE public.itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('stay', 'flight', 'dining', 'logistics', 'agenda')),
  title text,
  subtitle text,
  date date,
  day_index integer,
  cost numeric,
  points_used integer,
  confirmation_code text,
  cancellation_deadline timestamptz,
  payment_status text,
  latitude double precision,
  longitude double precision,
  time_label text,
  pro_tip text,
  amex_fhr boolean DEFAULT false,
  pref_match boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access items" ON public.itinerary_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itinerary_items.trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Published items readable" ON public.itinerary_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itinerary_items.trip_id AND trips.is_published = true));

-- 4. Secure view for shared trips (masks financial data for non-owners)
CREATE VIEW public.itinerary_items_public
WITH (security_invoker = on) AS
SELECT
  i.id, i.trip_id, i.type, i.title, i.subtitle, i.date, i.day_index,
  CASE WHEN t.user_id = auth.uid() THEN i.cost ELSE NULL END AS cost,
  CASE WHEN t.user_id = auth.uid() THEN i.points_used ELSE NULL END AS points_used,
  CASE WHEN t.user_id = auth.uid() THEN i.confirmation_code ELSE NULL END AS confirmation_code,
  i.cancellation_deadline, i.payment_status, i.latitude, i.longitude,
  i.time_label, i.pro_tip, i.amex_fhr, i.pref_match, i.created_at
FROM public.itinerary_items i
JOIN public.trips t ON t.id = i.trip_id;

-- 5. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
