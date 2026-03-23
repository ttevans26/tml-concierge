import { Plane, Train, Hotel, Car, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface TripLeg {
  id: string;
  type: "flight" | "rail" | "stay" | "transit";
  title: string;
  subtitle: string;
  date: string;
  confirmation: string;
  pointsUsed?: string;
  paymentMethod: string;
  cancellationDeadline?: string;
}

const mockLegs: TripLeg[] = [
  {
    id: "1",
    type: "stay",
    title: "Ryokan Sakaya — Nozawaonsen",
    subtitle: "Traditional hot spring ryokan, half-board included",
    date: "Jan 12 – 15, 2026",
    confirmation: "RYK-8842-NZ",
    pointsUsed: "45,000 Marriott Bonvoy",
    paymentMethod: "Amex Platinum",
    cancellationDeadline: "2026-01-05T23:59:00",
  },
  {
    id: "2",
    type: "flight",
    title: "Delta DL-178 — MXP → LAX",
    subtitle: "Delta One Suite, Award Booking",
    date: "Sep 17, 2026",
    confirmation: "DL7X9K2M",
    pointsUsed: "85,000 SkyMiles",
    paymentMethod: "Amex Platinum",
    cancellationDeadline: "2026-09-15T23:59:00",
  },
  {
    id: "3",
    type: "transit",
    title: "Hertz — Venice Airport (VCE)",
    subtitle: "Full-size SUV, GPS included",
    date: "Sep 6, 2026",
    confirmation: "HZ-991-VCE",
    paymentMethod: "Chase Sapphire Reserve",
    cancellationDeadline: "2026-09-04T12:00:00",
  },
];

const iconMap = {
  flight: Plane,
  rail: Train,
  stay: Hotel,
  transit: Car,
};

const typeLabel = {
  flight: "Flight",
  rail: "Rail",
  stay: "Stay",
  transit: "Rental",
};

function getCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 30) return `${days}d remaining`;
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

export default function LogisticsTimeline() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full">
      <h2 className="font-display text-2xl font-medium tracking-tight text-foreground mb-1">
        Upcoming Legs
      </h2>
      <p className="text-sm text-muted-foreground font-body mb-8">
        Your confirmed itinerary
      </p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-divider" />

        <div className="space-y-6">
          {mockLegs.map((leg, i) => {
            const Icon = iconMap[leg.type];
            return (
              <div
                key={leg.id}
                className="relative pl-12 animate-fade-in"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-3 w-[18px] h-[18px] rounded-full border border-forest bg-background flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-forest" />
                </div>

                <div className="border border-border rounded-md p-5 bg-background hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-forest" strokeWidth={1.5} />
                      <span className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                        {typeLabel[leg.type]}
                      </span>
                    </div>
                    <span className="text-xs font-body text-muted-foreground">
                      {leg.date}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-medium text-foreground mb-1">
                    {leg.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    {leg.subtitle}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-body">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Confirmation</span>
                      <span className="text-foreground font-medium tracking-wide">{leg.confirmation}</span>
                    </div>
                    {leg.pointsUsed && (
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Points Used</span>
                        <span className="text-foreground font-medium">{leg.pointsUsed}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Payment</span>
                      <span className="text-foreground font-medium">{leg.paymentMethod}</span>
                    </div>
                  </div>

                  {leg.cancellationDeadline && (
                    <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                      <span className="text-xs font-body text-muted-foreground">
                        Cancel by:{" "}
                        <span className="text-foreground font-medium">
                          {getCountdown(leg.cancellationDeadline)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
