import { AlertTriangle, Clock, CheckCircle, RefreshCw, Plane, Car, Hotel } from "lucide-react";

interface VaultBooking {
  id: string;
  type: "flight" | "transit" | "stay";
  title: string;
  subtitle: string;
  date: string;
  confirmation: string;
  bookedDaysAgo: number;
  cancellationDeadline?: string;
  cancellationLabel?: string;
  highlight: boolean;
  paymentMethod: string;
  pointsUsed?: string;
}

const vaultBookings: VaultBooking[] = [
  {
    id: "v1",
    type: "stay",
    title: "Ryokan Sakaya — Nozawaonsen",
    subtitle: "Traditional hot spring ryokan, half-board",
    date: "Jan 12 – 15, 2026",
    confirmation: "RYK-8842-NZ",
    bookedDaysAgo: 142,
    cancellationDeadline: "2026-01-05T23:59:00",
    cancellationLabel: "Jan 5, 2026",
    highlight: false,
    paymentMethod: "Amex Platinum",
    pointsUsed: "45,000 Marriott Bonvoy",
  },
  {
    id: "v2",
    type: "transit",
    title: "Hertz — Venice Airport (VCE)",
    subtitle: "Full-size SUV, GPS included",
    date: "Sep 6, 2026",
    confirmation: "HZ-991-VCE",
    bookedDaysAgo: 98,
    cancellationDeadline: "2026-09-04T12:00:00",
    cancellationLabel: "Sep 4, 2026",
    highlight: true,
    paymentMethod: "Chase Sapphire Reserve",
  },
  {
    id: "v3",
    type: "flight",
    title: "Delta DL-178 — MXP → LAX",
    subtitle: "Delta One Suite, Award Booking",
    date: "Sep 17, 2026",
    confirmation: "DL7X9K2M",
    bookedDaysAgo: 87,
    cancellationDeadline: "2026-09-15T23:59:00",
    cancellationLabel: "Sep 15, 2026",
    highlight: true,
    paymentMethod: "Amex Platinum",
    pointsUsed: "85,000 SkyMiles",
  },
];

const iconMap = {
  flight: Plane,
  transit: Car,
  stay: Hotel,
};

function getProTip(type: VaultBooking["type"]): string {
  switch (type) {
    case "flight": return "✦ Pro Tip: Use Amex Platinum for 5x points.";
    case "stay": return "✦ Pro Tip: Book via Amex Travel for 5x points + FHR Credits.";
    case "transit": return "✦ Pro Tip: Use Chase Sapphire Reserve for 3x points on travel.";
  }
}

function getDeadlineUrgency(deadline: string): "expired" | "urgent" | "soon" | "safe" {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const days = diff / (1000 * 60 * 60 * 24);
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "safe";
}

function getCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 30) return `${days}d remaining`;
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

const urgencyStyles = {
  expired: "bg-destructive/10 text-destructive border-destructive/30",
  urgent: "bg-destructive/8 text-destructive border-destructive/20",
  soon: "bg-amber-50 text-amber-800 border-amber-200",
  safe: "bg-forest/5 text-forest border-forest/20",
};

export default function SmartInbox() {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
          Travel Vault
        </h2>
        <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground border border-border rounded-full px-3 py-1">
          Smart Inbox
        </span>
      </div>
      <p className="text-sm text-muted-foreground font-body mb-8">
        Bookings older than 60 days — review &amp; re-verify
      </p>

      <div className="space-y-4">
        {vaultBookings.map((booking) => {
          const Icon = iconMap[booking.type];
          const urgency = booking.cancellationDeadline
            ? getDeadlineUrgency(booking.cancellationDeadline)
            : null;

          return (
            <div
              key={booking.id}
              className={`border rounded-md transition-shadow ${
                booking.highlight
                  ? "border-forest/40 shadow-sm"
                  : "border-border"
              }`}
            >
              {/* Cancellation Deadline — Hero position */}
              {booking.cancellationDeadline && urgency && (
                <div
                  className={`px-5 py-3 rounded-t-md border-b flex items-center justify-between ${urgencyStyles[urgency]}`}
                >
                  <div className="flex items-center gap-2">
                    {urgency === "expired" ? (
                      <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <Clock className="w-4 h-4" strokeWidth={1.5} />
                    )}
                    <span className="text-sm font-body font-semibold">
                      {urgency === "expired"
                        ? "Cancellation window closed"
                        : `Cancel by ${booking.cancellationLabel}`}
                    </span>
                  </div>
                  <span className="text-xs font-body font-medium">
                    {getCountdown(booking.cancellationDeadline)}
                  </span>
                </div>
              )}

              <div className="p-5">
                {/* Top row: type + re-verify + highlight */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-forest" strokeWidth={1.5} />
                    <span className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                      {booking.type === "transit" ? "Rental" : booking.type}
                    </span>
                    {booking.highlight && (
                      <span className="text-[10px] font-body font-semibold uppercase tracking-wider bg-forest text-primary-foreground px-2 py-0.5 rounded">
                        Flagged
                      </span>
                    )}
                  </div>

                  <button className="flex items-center gap-1.5 text-xs font-body font-medium text-forest border border-forest/30 rounded-full px-3 py-1 hover:bg-forest/5 transition-colors">
                    <RefreshCw className="w-3 h-3" strokeWidth={2} />
                    Re-verify
                  </button>
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-medium text-foreground mb-1">
                  {booking.title}
                </h3>
                <p className="text-sm text-muted-foreground font-body mb-4">
                  {booking.subtitle} · {booking.date}
                </p>

                {/* Meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-body">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Confirmation</span>
                    <span className="text-foreground font-medium tracking-wide">
                      {booking.confirmation}
                    </span>
                  </div>
                  {booking.pointsUsed && (
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Points Used</span>
                      <span className="text-foreground font-medium">{booking.pointsUsed}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Payment</span>
                    <span className="text-foreground font-medium">{booking.paymentMethod}</span>
                  </div>
                </div>

                {/* Booked ago */}
                <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-[11px] font-body text-muted-foreground">
                    Booked {booking.bookedDaysAgo} days ago — due for review
                  </span>
                </div>

                <p className="mt-3 text-xs font-body font-medium text-forest">
                  {getProTip(booking.type)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
