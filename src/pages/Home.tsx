import { useNavigate } from "react-router-dom";
import { Plane, ArrowRight } from "lucide-react";

function getDaysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

const nextTrip = {
  destination: "Europe Grand Tour",
  dates: "August 21 – September 17, 2026",
  departure: "2026-08-21",
};

const itineraryLegs = [
  { dates: "Aug 21 – Aug 24", location: "Sherborne", stay: "Queens Arms" },
  { dates: "Aug 24 – Aug 26", location: "Bath", stay: "Roseate Villa" },
  { dates: "Aug 26 – Aug 28", location: "Paris", stay: "Hotel L'Ormaie" },
  { dates: "Aug 28 – Sep 1", location: "St-Rémy-de-Provence", stay: "Hotel Sous les Figuiers" },
  { dates: "Sep 1 – Sep 6", location: "Antibes", stay: "La Villa Port d'Antibes" },
  { dates: "Sep 6 – Sep 8", location: "Verona / Valpolicella", stay: "Hotel Accademia" },
  { dates: "Sep 8 – Sep 12", location: "Dolomites", stay: "Adler Spa Resort" },
  { dates: "Sep 12 – Sep 16", location: "Lake Garda", stay: "Hotel Bella Riva" },
  { dates: "Sep 16 – Sep 17", location: "Stresa", stay: "Sempione Boutique Hotel" },
  { dates: "Sep 17", location: "MXP", stay: "Departure" },
];

export default function Home() {
  const navigate = useNavigate();
  const daysLeft = getDaysUntil(nextTrip.departure);

  return (
    <div className="flex-1 flex flex-col p-8">
      {/* Header section */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Plane className="w-4 h-4 text-forest" strokeWidth={1.5} />
          <span className="text-[11px] font-body font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Next Upcoming Trip
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 mb-3">
          <h2 className="font-display text-5xl font-medium tracking-tight text-foreground">
            {nextTrip.destination}
          </h2>
          <div className="flex flex-col items-center border border-border rounded-lg px-8 py-4 bg-background">
            <span className="font-display text-4xl font-light text-foreground tracking-tight leading-none">
              {daysLeft}
            </span>
            <span className="text-[9px] font-body font-medium uppercase tracking-[0.25em] text-muted-foreground mt-1">
              Days Away
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/trips")}
          className="inline-flex items-center gap-2 text-sm font-body font-semibold text-forest tracking-wide hover:underline underline-offset-4 transition-all"
        >
          View Trip
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <p className="text-sm font-body text-muted-foreground mt-3">
          {nextTrip.dates}
        </p>
      </div>

      {/* Trip Synopsis Table */}
      <div className="flex-1 flex items-start justify-center">
        <div className="border border-border rounded-lg bg-background overflow-hidden">
          <div className="px-6 py-4">
            <h3 className="text-xs font-body font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Trip Itinerary Overview
            </h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-t border-border">
                <th className="text-left px-6 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Dates
                </th>
                <th className="text-left px-6 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Location
                </th>
                <th className="text-left px-6 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Stay
                </th>
              </tr>
            </thead>
            <tbody>
              {itineraryLegs.map((leg, i) => (
                <tr
                  key={i}
                  className="border-t border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-6 py-3 text-sm font-body text-muted-foreground whitespace-nowrap">
                    {leg.dates}
                  </td>
                  <td className="px-6 py-3 text-sm font-body font-medium text-foreground whitespace-nowrap">
                    {leg.location}
                  </td>
                  <td className="px-6 py-3 text-sm font-body text-foreground whitespace-nowrap">
                    {leg.stay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
