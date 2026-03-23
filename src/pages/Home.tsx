import { useNavigate } from "react-router-dom";
import { Plane, MapPin, ArrowRight, Calendar, Hotel, Globe } from "lucide-react";

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

const synopsis = [
  { icon: Calendar, label: "Dates", value: "August 21 – September 17, 2026" },
  { icon: Globe, label: "Locations", value: "Sherborne, Dolomites, Paris" },
  { icon: Hotel, label: "Hotels", value: "Queens Arms, Adler Spa Resort, Hotel L'Ormaie" },
];

export default function Home() {
  const navigate = useNavigate();
  const daysLeft = getDaysUntil(nextTrip.departure);

  return (
    <div className="flex-1 flex flex-col p-8">
      {/* Header section */}
      <div className="text-center mb-10">
        {/* Subtle label */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Plane className="w-4 h-4 text-forest" strokeWidth={1.5} />
          <span className="text-[11px] font-body font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Next Upcoming Trip
          </span>
        </div>

        {/* Destination */}
        <h2 className="font-display text-5xl font-medium tracking-tight text-foreground mb-3">
          {nextTrip.destination}
        </h2>

        {/* CTA - directly below title, prominent */}
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

      {/* Main content: countdown left, synopsis center */}
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

        {/* Center: Trip Synopsis */}
        <div className="border border-border rounded-lg bg-background px-8 py-8 max-w-md w-full">
          <h3 className="text-xs font-body font-medium uppercase tracking-[0.2em] text-muted-foreground mb-5">
            Trip Synopsis
          </h3>
          <ul className="space-y-4">
            {synopsis.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <item.icon className="w-4 h-4 text-forest mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <span className="text-xs font-body font-semibold text-foreground uppercase tracking-wide">
                    {item.label}
                  </span>
                  <p className="text-sm font-body text-muted-foreground mt-0.5">
                    {item.value}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Highlights */}
      <div className="mt-8 flex items-center justify-center gap-6">
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
    </div>
  );
}
