import { useNavigate } from "react-router-dom";
import { Plane, MapPin, ArrowRight } from "lucide-react";

function getDaysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

const nextTrip = {
  destination: "Europe Grand Tour",
  dates: "August 21 – September 17, 2026",
  departure: "2026-08-21",
  highlights: [
    "Queens Arms, Sherborne",
    "Adler Spa Resort, Dolomites",
    "Hotel L'Ormaie, Paris",
  ],
};

export default function Home() {
  const navigate = useNavigate();
  const daysLeft = getDaysUntil(nextTrip.departure);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Subtle label */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Plane className="w-4 h-4 text-forest" strokeWidth={1.5} />
          <span className="text-[11px] font-body font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Next Upcoming Trip
          </span>
        </div>

        {/* Destination */}
        <h2 className="font-display text-5xl font-medium tracking-tight text-foreground mb-2">
          {nextTrip.destination}
        </h2>
        <p className="text-sm font-body text-muted-foreground mb-12">
          {nextTrip.dates}
        </p>

        {/* Countdown */}
        <div className="inline-flex flex-col items-center border border-border rounded-sm px-16 py-10 bg-background">
          <span className="font-display text-7xl font-light text-foreground tracking-tight">
            {daysLeft}
          </span>
          <span className="text-[11px] font-body font-medium uppercase tracking-[0.25em] text-muted-foreground mt-2">
            Days Until Departure
          </span>
        </div>

        {/* Highlights */}
        <div className="mt-12 flex items-center justify-center gap-6">
          {nextTrip.highlights.map((h) => (
            <div
              key={h}
              className="flex items-center gap-2 text-xs font-body text-muted-foreground"
            >
              <MapPin className="w-3 h-3 text-forest" strokeWidth={1.5} />
              {h}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/trips")}
          className="mt-10 inline-flex items-center gap-2 text-xs font-body font-medium text-forest tracking-wide hover:underline underline-offset-4 transition-all"
        >
          View Full Itinerary
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
