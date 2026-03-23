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
  { dates: "Aug 21 – Aug 22", location: "Sherborne", stay: "Queens Arms" },
  { dates: "Aug 23 – Sep 5", location: "Dolomites", stay: "Adler Spa Resort" },
  { dates: "Sep 6 – Sep 17", location: "Paris", stay: "Hotel L'Ormaie" },
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

        <h2 className="font-display text-5xl font-medium tracking-tight text-foreground mb-3">
          {nextTrip.destination}
        </h2>

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

      {/* Main content: countdown left, synopsis table center */}
      <div className="flex-1 flex items-start justify-center gap-10">
        {/* Left: Countdown */}
        <div className="flex flex-col items-center border border-border rounded-lg px-14 py-10 bg-background">
          <span className="font-display text-7xl font-light text-foreground tracking-tight">
            {daysLeft}
          </span>
          <span className="text-[11px] font-body font-medium uppercase tracking-[0.25em] text-muted-foreground mt-2">
            Days Until Departure
          </span>
        </div>

        {/* Center: Trip Synopsis Table */}
        <div className="border border-border rounded-lg bg-background max-w-lg w-full overflow-hidden">
          <div className="px-6 py-4">
            <h3 className="text-xs font-body font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Trip Synopsis
            </h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-t border-border">
                <th className="text-left px-6 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                  Dates
                </th>
                <th className="text-left px-6 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                  Location
                </th>
                <th className="text-left px-6 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
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
                  <td className="px-6 py-3 text-sm font-body font-medium text-foreground">
                    {leg.location}
                  </td>
                  <td className="px-6 py-3 text-sm font-body text-foreground">
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
