import { useState, useEffect } from "react";
import { ArrowLeft, Globe, Lock, Copy, Eye, EyeOff, CreditCard, Heart, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const { cards, toggleCard, preferences, setPreferences } = useProfile();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("trips")
      .select("id, title, destination, start_date, end_date, is_published")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setTrips(data);
      });
  }, [user]);

  async function togglePublish(id: string) {
    const trip = trips.find((t) => t.id === id);
    if (!trip) return;
    const newVal = !trip.is_published;
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, is_published: newVal } : t)));
    await supabase.from("trips").update({ is_published: newVal }).eq("id", id);
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  const displayName = user?.user_metadata?.full_name || user?.email || "User";

  return (
    <div className="flex-1 overflow-auto bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">Profile</h1>
            <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase mt-0.5">Preferences & Rewards</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* User card */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-sm bg-forest text-primary-foreground flex items-center justify-center text-lg font-body font-semibold">
            {initials}
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium text-foreground">{displayName}</h2>
            <p className="text-sm font-body text-muted-foreground">TML Concierge · {trips.length} trip{trips.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rewards Wallet */}
          <section className="border border-border rounded-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-4 h-4 text-forest" strokeWidth={1.5} />
              <h3 className="font-display text-lg font-medium text-foreground">Rewards Wallet</h3>
            </div>
            <p className="text-xs font-body text-muted-foreground mb-5">
              Toggle the cards you own. The system will suggest the best card for each expense.
            </p>
            <div className="space-y-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className={`flex items-center justify-between p-4 border rounded-sm transition-all ${
                    card.owned ? "border-forest/40 bg-forest/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-body font-bold px-2 py-1 rounded-sm ${
                        card.owned ? "bg-forest text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {card.earn}
                    </span>
                    <div>
                      <p className="text-sm font-body font-medium text-foreground">{card.name}</p>
                      <p className="text-[10px] font-body text-muted-foreground">
                        {card.categories.join(", ")}
                      </p>
                    </div>
                  </div>
                  <Switch checked={card.owned} onCheckedChange={() => toggleCard(card.id)} />
                </div>
              ))}
            </div>
          </section>

          {/* Travel Preferences */}
          <section className="border border-border rounded-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Heart className="w-4 h-4 text-forest" strokeWidth={1.5} />
              <h3 className="font-display text-lg font-medium text-foreground">Travel Preferences</h3>
            </div>
            <p className="text-xs font-body text-muted-foreground mb-5">
              Set your must-haves. Hotels matching your preferences will show a Match badge.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-body font-medium text-foreground">Adults Only</p>
                  <p className="text-[10px] font-body text-muted-foreground">Prefer adults-only properties</p>
                </div>
                <Switch
                  checked={preferences.adultsOnly}
                  onCheckedChange={(v) => setPreferences({ ...preferences, adultsOnly: v })}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-body font-medium text-foreground">Sauna / Gym</p>
                  <p className="text-[10px] font-body text-muted-foreground">Fitness & sauna facilities</p>
                </div>
                <Switch
                  checked={preferences.saunaGym}
                  onCheckedChange={(v) => setPreferences({ ...preferences, saunaGym: v })}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="text-sm font-body font-medium text-foreground">Spa</p>
                  <p className="text-[10px] font-body text-muted-foreground">On-site spa & wellness</p>
                </div>
                <Switch
                  checked={preferences.spa}
                  onCheckedChange={(v) => setPreferences({ ...preferences, spa: v })}
                />
              </div>
            </div>

            {/* Target Nightly Rate */}
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                <h4 className="text-sm font-body font-medium text-foreground">Target Nightly Rate</h4>
                <span className="ml-auto text-lg font-display font-medium text-foreground">
                  ${preferences.targetNightlyRate}
                </span>
              </div>
              <Slider
                value={[preferences.targetNightlyRate]}
                onValueChange={([v]) => setPreferences({ ...preferences, targetNightlyRate: v })}
                min={100}
                max={1500}
                step={25}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-[10px] font-body text-muted-foreground">
                <span>$100</span>
                <span>$1,500</span>
              </div>
            </div>
          </section>
        </div>

        {/* Trip Visibility */}
        <section>
          <h3 className="font-display text-lg font-medium text-foreground mb-1">Trip Visibility</h3>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Published trips share your Pinned Gems and logistics structure. Confirmation numbers and prices are always redacted.
          </p>
          {trips.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">No trips yet. Create one from the Trips page.</p>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className={`border rounded-sm p-5 transition-all ${trip.is_published ? "border-forest/40 bg-forest/[0.03]" : "border-border"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {trip.is_published ? <Globe className="w-4 h-4 text-forest" strokeWidth={1.5} /> : <Lock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />}
                        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                          {trip.is_published ? "Published" : "Private"}
                        </span>
                      </div>
                      <h4 className="font-display text-lg font-medium text-foreground">{trip.title}</h4>
                      <p className="text-sm text-muted-foreground font-body">{trip.destination} · {trip.start_date} — {trip.end_date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Switch checked={trip.is_published} onCheckedChange={() => togglePublish(trip.id)} />
                      <span className="text-[10px] font-body text-muted-foreground">{trip.is_published ? "Public" : "Private"}</span>
                    </div>
                  </div>
                  {trip.is_published && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                        <span className="text-[11px] font-body font-medium text-forest uppercase tracking-wider">What friends see</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs font-body">
                        <div className="flex items-center gap-1.5"><Eye className="w-3 h-3 text-forest" strokeWidth={1.5} /><span className="text-foreground">Pinned Gems & Map</span></div>
                        <div className="flex items-center gap-1.5"><Eye className="w-3 h-3 text-forest" strokeWidth={1.5} /><span className="text-foreground">Logistics Structure</span></div>
                        <div className="flex items-center gap-1.5"><EyeOff className="w-3 h-3 text-destructive" strokeWidth={1.5} /><span className="text-muted-foreground">Confirmations</span></div>
                        <div className="flex items-center gap-1.5"><EyeOff className="w-3 h-3 text-destructive" strokeWidth={1.5} /><span className="text-muted-foreground">Prices & Points</span></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Friends */}
        <section>
          <h3 className="font-display text-lg font-medium text-foreground mb-1">Approved Friends</h3>
          <p className="text-sm text-muted-foreground font-body mb-6">These people can view your published trips</p>
          <div className="border border-border rounded-sm divide-y divide-border">
            {[{ name: "Elena Marchetti", initials: "EM", sharedTrips: "Venice & Dolomites" }].map((f) => (
              <div key={f.name} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-secondary text-foreground flex items-center justify-center text-xs font-body font-medium">{f.initials}</div>
                <div className="flex-1">
                  <span className="text-sm font-body font-medium text-foreground">{f.name}</span>
                  <span className="text-xs font-body text-muted-foreground block">Sees: {f.sharedTrips}</span>
                </div>
                <Copy className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
