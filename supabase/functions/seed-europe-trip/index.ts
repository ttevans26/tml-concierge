import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already has trips
    const { data: existingTrips } = await supabase
      .from("trips")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (existingTrips && existingTrips.length > 0) {
      return new Response(JSON.stringify({ message: "Seed data already exists", trip_id: existingTrips[0].id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the Europe 2026 trip
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        title: "Europe Grand Tour",
        destination: "Europe",
        start_date: "2026-08-21",
        end_date: "2026-09-17",
        target_nightly_budget: 400,
        is_published: false,
      })
      .select()
      .single();

    if (tripErr) throw tripErr;

    const tripId = trip.id;

    // Seed itinerary items
    const items = [
      // ── Logistics ──
      { trip_id: tripId, type: "logistics", title: "Eurostar → Paris", subtitle: "1st Class · St Pancras", day_index: 5, time_label: "7:01 AM → 10:17 AM", pro_tip: "✦ Use CSR for 3x transit." },
      { trip_id: tripId, type: "logistics", title: "TGV Paris → Avignon", subtitle: "1st Class · Gare de Lyon", day_index: 7, time_label: "8:12 AM → 11:00 AM", pro_tip: "✦ Use CSR for 3x transit." },
      { trip_id: tripId, type: "logistics", title: "Train St-Rémy → Antibes", subtitle: "TER via Avignon", day_index: 11, time_label: "9:30 AM → 1:15 PM", pro_tip: "✦ Use CSR for 3x transit." },
      { trip_id: tripId, type: "logistics", title: "Flight NCE → VRN", subtitle: "easyJet · EZY4519", day_index: 16, time_label: "2:30 PM → 4:00 PM", confirmation_code: "EZY-7R42K", pro_tip: "✦ Use Amex Platinum for 5x flights." },
      { trip_id: tripId, type: "logistics", title: "Transfer → MXP", subtitle: "Private car to Malpensa", day_index: 27, time_label: "10:00 AM", pro_tip: "✦ Departure leg." },

      // ── Stays ──
      // Queens Arms: nights 0-2
      { trip_id: tripId, type: "stay", title: "Queens Arms", subtitle: "Sherborne, Dorset", day_index: 0, cost: 185, confirmation_code: "QA-2108", date: "2026-08-21" },
      { trip_id: tripId, type: "stay", title: "Queens Arms", subtitle: "Night 2 of 3", day_index: 1, cost: 185, date: "2026-08-22" },
      { trip_id: tripId, type: "stay", title: "Queens Arms", subtitle: "Night 3 of 3", day_index: 2, cost: 185, date: "2026-08-23" },
      // Roseate Villa: nights 3-4
      { trip_id: tripId, type: "stay", title: "Roseate Villa", subtitle: "Bath · Garden Suite", day_index: 3, cost: 310, confirmation_code: "RV-4421", cancellation_deadline: "2026-08-20T23:59:00Z", date: "2026-08-24" },
      { trip_id: tripId, type: "stay", title: "Roseate Villa", subtitle: "Night 2 of 2", day_index: 4, cost: 310, date: "2026-08-25" },
      // Hotel L'Ormaie: nights 5-6
      { trip_id: tripId, type: "stay", title: "Hotel L'Ormaie", subtitle: "Paris · Saint-Germain", day_index: 5, cost: 420, confirmation_code: "LO-6633", amex_fhr: true, cancellation_deadline: "2026-08-22T23:59:00Z", pro_tip: "✦ Book via Amex FHR for 5x + $200 credit.", date: "2026-08-26" },
      { trip_id: tripId, type: "stay", title: "Hotel L'Ormaie", subtitle: "Night 2 of 2", day_index: 6, cost: 420, date: "2026-08-27" },
      // Hotel Sous les Figuiers: nights 7-10
      { trip_id: tripId, type: "stay", title: "Hotel Sous les Figuiers", subtitle: "St-Rémy-de-Provence", day_index: 7, cost: 375, confirmation_code: "SLF-1192", payment_status: "paid", pro_tip: "✦ Under target — +$100 splurge credit.", date: "2026-08-28" },
      { trip_id: tripId, type: "stay", title: "Hotel Sous les Figuiers", subtitle: "Night 2 of 4", day_index: 8, cost: 375, payment_status: "paid", date: "2026-08-29" },
      { trip_id: tripId, type: "stay", title: "Hotel Sous les Figuiers", subtitle: "Night 3 of 4", day_index: 9, cost: 375, payment_status: "paid", date: "2026-08-30" },
      { trip_id: tripId, type: "stay", title: "Hotel Sous les Figuiers", subtitle: "Night 4 of 4", day_index: 10, cost: 375, payment_status: "paid", date: "2026-08-31" },
      // La Villa Port d'Antibes: nights 11-15
      { trip_id: tripId, type: "stay", title: "La Villa Port d'Antibes", subtitle: "Antibes · Sea View", day_index: 11, cost: 350, confirmation_code: "LVA-8830", payment_status: "paid", date: "2026-09-01" },
      { trip_id: tripId, type: "stay", title: "La Villa Port d'Antibes", subtitle: "Night 2 of 5", day_index: 12, cost: 350, payment_status: "paid", date: "2026-09-02" },
      { trip_id: tripId, type: "stay", title: "La Villa Port d'Antibes", subtitle: "Night 3 of 5", day_index: 13, cost: 350, payment_status: "paid", date: "2026-09-03" },
      { trip_id: tripId, type: "stay", title: "La Villa Port d'Antibes", subtitle: "Night 4 of 5", day_index: 14, cost: 350, payment_status: "paid", date: "2026-09-04" },
      { trip_id: tripId, type: "stay", title: "La Villa Port d'Antibes", subtitle: "Night 5 of 5", day_index: 15, cost: 350, payment_status: "paid", date: "2026-09-05" },
      // Hotel Accademia: nights 16-17
      { trip_id: tripId, type: "stay", title: "Hotel Accademia", subtitle: "Verona · Centro Storico", day_index: 16, cost: 280, confirmation_code: "HA-5547", payment_status: "hold", cancellation_deadline: "2026-09-02T23:59:00Z", date: "2026-09-06" },
      { trip_id: tripId, type: "stay", title: "Hotel Accademia", subtitle: "Night 2 of 2", day_index: 17, cost: 280, payment_status: "hold", date: "2026-09-07" },
      // Adler Spa Resort: nights 18-21
      { trip_id: tripId, type: "stay", title: "Adler Spa Resort", subtitle: "Dolomites · Spa & Wellness · Sauna · Gym", day_index: 18, cost: 620, confirmation_code: "ADL-9910", pref_match: true, cancellation_deadline: "2026-09-04T23:59:00Z", pro_tip: "✦ Funded by splurge credit from St-Rémy savings.", date: "2026-09-08" },
      { trip_id: tripId, type: "stay", title: "Adler Spa Resort", subtitle: "Night 2 of 4 · Spa · Sauna", day_index: 19, cost: 620, pref_match: true, date: "2026-09-09" },
      { trip_id: tripId, type: "stay", title: "Adler Spa Resort", subtitle: "Night 3 of 4", day_index: 20, cost: 620, pref_match: true, date: "2026-09-10" },
      { trip_id: tripId, type: "stay", title: "Adler Spa Resort", subtitle: "Night 4 of 4", day_index: 21, cost: 620, pref_match: true, date: "2026-09-11" },
      // Hotel Bella Riva: nights 22-25
      { trip_id: tripId, type: "stay", title: "Hotel Bella Riva", subtitle: "Garda · Lakefront · Fitness · Sauna", day_index: 22, cost: 290, confirmation_code: "HBR-3316", payment_status: "hold", pref_match: true, date: "2026-09-12" },
      { trip_id: tripId, type: "stay", title: "Hotel Bella Riva", subtitle: "Night 2 of 4 · Sauna", day_index: 23, cost: 290, payment_status: "hold", pref_match: true, date: "2026-09-13" },
      { trip_id: tripId, type: "stay", title: "Hotel Bella Riva", subtitle: "Night 3 of 4", day_index: 24, cost: 290, payment_status: "hold", pref_match: true, date: "2026-09-14" },
      { trip_id: tripId, type: "stay", title: "Hotel Bella Riva", subtitle: "Night 4 of 4", day_index: 25, cost: 290, payment_status: "hold", pref_match: true, date: "2026-09-15" },
      // Sempione Boutique Hotel: night 26
      { trip_id: tripId, type: "stay", title: "Sempione Boutique Hotel", subtitle: "Stresa, Lake Maggiore", day_index: 26, cost: 195, confirmation_code: "SBH-7704", date: "2026-09-16" },

      // ── Agenda ──
      { trip_id: tripId, type: "agenda", title: "Arrive Sherborne", subtitle: "Settle in, village walk", day_index: 0, time_label: "3:00 PM" },
      { trip_id: tripId, type: "agenda", title: "Sherborne Abbey & Castle", subtitle: "Village exploration", day_index: 1, time_label: "10:00 AM" },
      { trip_id: tripId, type: "agenda", title: "Roman Baths & Royal Crescent", subtitle: "Bath city tour", day_index: 3, time_label: "10:00 AM" },
      { trip_id: tripId, type: "agenda", title: "Musée d'Orsay", subtitle: "Impressionists collection", day_index: 5, time_label: "10:30 AM" },
      { trip_id: tripId, type: "agenda", title: "Le Marais Walking Tour", subtitle: "Guided neighborhood walk", day_index: 6, time_label: "2:00 PM" },
      { trip_id: tripId, type: "agenda", title: "Les Baux-de-Provence", subtitle: "Hilltop village day trip", day_index: 8, time_label: "10:00 AM" },
      { trip_id: tripId, type: "agenda", title: "Pont du Gard", subtitle: "Roman aqueduct excursion", day_index: 9, time_label: "9:00 AM" },
      { trip_id: tripId, type: "agenda", title: "Antibes Old Town", subtitle: "Marché Provençal & Picasso Museum", day_index: 12, time_label: "10:00 AM" },
      { trip_id: tripId, type: "agenda", title: "Arena di Verona", subtitle: "Evening opera performance", day_index: 16, time_label: "8:00 PM" },
      { trip_id: tripId, type: "agenda", title: "Dolomites Hike — Seceda", subtitle: "Guided alpine trail", day_index: 18, time_label: "8:00 AM" },
      { trip_id: tripId, type: "agenda", title: "Alpe di Siusi", subtitle: "Meadow walk & cable car", day_index: 20, time_label: "9:30 AM" },
      { trip_id: tripId, type: "agenda", title: "Sirmione Castle", subtitle: "Scaligero Castle & thermal baths", day_index: 22, time_label: "10:00 AM" },
      { trip_id: tripId, type: "agenda", title: "Borromean Islands", subtitle: "Boat tour from Stresa", day_index: 26, time_label: "9:00 AM" },
      { trip_id: tripId, type: "agenda", title: "Departure", subtitle: "Transfer to MXP Airport", day_index: 27, time_label: "10:00 AM" },

      // ── Dining ──
      { trip_id: tripId, type: "dining", title: "Queens Arms Pub Dinner", subtitle: "Local gastropub", day_index: 0, time_label: "7:30 PM" },
      { trip_id: tripId, type: "dining", title: "The Pump Room", subtitle: "Afternoon tea, Bath", day_index: 3, time_label: "3:00 PM" },
      { trip_id: tripId, type: "dining", title: "Le Comptoir du Panthéon", subtitle: "French bistro", day_index: 5, time_label: "8:00 PM" },
      { trip_id: tripId, type: "dining", title: "La Table de Marius", subtitle: "Provençal cuisine, St-Rémy", day_index: 8, time_label: "8:30 PM" },
      { trip_id: tripId, type: "dining", title: "Le Figuier de St-Esprit", subtitle: "Michelin-starred, Antibes", day_index: 12, time_label: "8:00 PM", pro_tip: "✦ Use CSR for 3x dining." },
      { trip_id: tripId, type: "dining", title: "Osteria Mondodoro", subtitle: "Traditional Veronese", day_index: 16, time_label: "7:30 PM" },
      { trip_id: tripId, type: "dining", title: "Adler Spa Half-Board", subtitle: "Included fine dining", day_index: 18, time_label: "7:00 PM" },
      { trip_id: tripId, type: "dining", title: "Ristorante Lido 84", subtitle: "Lakeside tasting menu, Gardone", day_index: 22, time_label: "8:00 PM", pro_tip: "✦ Use CSR for 3x dining." },
      { trip_id: tripId, type: "dining", title: "Trattoria del Pesce", subtitle: "Lake Maggiore seafood", day_index: 26, time_label: "8:00 PM" },
    ];

    const { error: itemsErr } = await supabase
      .from("itinerary_items")
      .insert(items);

    if (itemsErr) throw itemsErr;

    return new Response(JSON.stringify({ success: true, trip_id: tripId, items_count: items.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
