

# TML Concierge — Backend Architecture Plan

## Overview
Create the database schema, RLS policies, a secure view for shared trips, and hook up the frontend to read/write from the database instead of mock data. This also requires adding authentication so users can actually interact with protected tables.

---

## Phase 1: Database Schema (Migration)

### Table: `profiles`
- `id` (uuid, PK, references auth.users)
- `full_name` (text)
- `avatar_url` (text)
- `travel_preferences` (jsonb) — stores adultsOnly, saunaGym, spa, targetNightlyRate
- `active_cards` (jsonb) — stores the user's reward card selections
- `created_at`, `updated_at` timestamps

Auto-create via trigger on `auth.users` insert.

### Table: `trips`
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, NOT NULL, references profiles.id)
- `title` (text)
- `destination` (text)
- `start_date` (date)
- `end_date` (date)
- `target_nightly_budget` (numeric)
- `is_published` (boolean, default false)
- `created_at`, `updated_at` timestamps

### Table: `itinerary_items`
- `id` (uuid, PK, default gen_random_uuid())
- `trip_id` (uuid, NOT NULL, references trips.id ON DELETE CASCADE)
- `type` (text, check in: stay, flight, dining, logistics, agenda)
- `title` (text)
- `subtitle` (text)
- `date` (date)
- `day_index` (integer) — position in the trip grid
- `cost` (numeric)
- `points_used` (integer)
- `confirmation_code` (text)
- `cancellation_deadline` (timestamptz)
- `payment_status` (text) — paid, hold, pending, rewards
- `latitude` (double precision)
- `longitude` (double precision)
- `time_label` (text) — display time like "7:01 AM"
- `pro_tip` (text)
- `amex_fhr` (boolean, default false)
- `pref_match` (boolean, default false)
- `created_at` timestamp

---

## Phase 2: Row Level Security

### `profiles`
- **Owner full access**: `auth.uid() = id` for SELECT, INSERT, UPDATE, DELETE

### `trips`
- **Owner full CRUD**: `auth.uid() = user_id`
- **Published read**: Authenticated users can SELECT where `is_published = true`

### `itinerary_items`
- **Owner full CRUD**: via join — `EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_id AND trips.user_id = auth.uid())`
- **Published read (masked)**: handled via a secure view (below)

### Secure View: `itinerary_items_public`
```sql
CREATE VIEW public.itinerary_items_public
WITH (security_invoker = on) AS
SELECT
  id, trip_id, type, title, subtitle, date, day_index,
  CASE WHEN t.user_id = auth.uid() THEN cost ELSE NULL END AS cost,
  CASE WHEN t.user_id = auth.uid() THEN points_used ELSE NULL END AS points_used,
  CASE WHEN t.user_id = auth.uid() THEN confirmation_code ELSE NULL END AS confirmation_code,
  cancellation_deadline, payment_status, latitude, longitude,
  time_label, pro_tip, amex_fhr, pref_match
FROM public.itinerary_items i
JOIN public.trips t ON t.id = i.trip_id;
```

Non-owners see `cost`, `points_used`, and `confirmation_code` as NULL. The base table's SELECT policy for non-owners requires `is_published = true` on the parent trip.

### Profile creation trigger
A `SECURITY DEFINER` function that auto-creates a profile row when a new user signs up via `auth.users` insert trigger.

---

## Phase 3: Authentication UI

Since RLS requires authenticated users, we need auth:
- Add a simple **Login / Sign Up page** at `/auth` with email + password
- Wrap the app in an auth guard that redirects unauthenticated users
- Add a **sign out** button to the GlobalNav or Profile page
- Email confirmation will be required (no auto-confirm)

---

## Phase 4: Frontend Hookup

### ProfileContext
- On auth, fetch `profiles` row and populate context
- `toggleCard` → update `active_cards` jsonb in profiles
- `setPreferences` → update `travel_preferences` jsonb in profiles

### Trips page (`src/pages/Trips.tsx`)
- Replace the hardcoded `trips` array with a query: `supabase.from('trips').select('*').eq('user_id', userId)`
- Replace hardcoded booking cells with: `supabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day_index')`
- Transform flat itinerary_items rows back into the grid structure (group by type + day_index)
- Wire up the NewJourneyModal to INSERT into `trips`
- Wire up DayEditor / card editing to INSERT/UPDATE/DELETE `itinerary_items`

### SharedTripView (`src/components/SharedTripView.tsx`)
- Query `itinerary_items_public` view joined with `trips` where `is_published = true`
- Cost/confirmation fields will automatically be NULL for non-owners

### Profile page
- Toggle `is_published` → UPDATE `trips` set `is_published`
- Preferences/cards → UPDATE `profiles`

### Seed data
- After tables are created, provide a migration or edge function to seed the existing mock data for the logged-in user so the app isn't empty on first load

---

## Files to Create/Modify

| File | Action |
|---|---|
| Migration SQL | Create tables, RLS, view, trigger |
| `src/pages/Auth.tsx` | New login/signup page |
| `src/App.tsx` | Add auth route, auth guard |
| `src/contexts/ProfileContext.tsx` | Fetch/write to database |
| `src/pages/Trips.tsx` | Replace mock data with queries |
| `src/components/SharedTripView.tsx` | Query public view |
| `src/pages/Profile.tsx` | Wire publish toggle & prefs to DB |
| `src/hooks/useAuth.tsx` | Auth state hook |

---

## Technical Notes
- The grid transformation (flat rows → 4-row × N-day matrix) will be a utility function that maps `itinerary_items` grouped by `(type, day_index)` back into the existing `TripData` shape
- Budget calculations will derive from `SUM(cost)` on itinerary_items for the trip
- The `payment_status` column supports the existing paid/hold/pending/rewards display

