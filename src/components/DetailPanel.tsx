import { X, MapPin, ExternalLink, Navigation, Pencil, Star, Clock, CreditCard } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useProfile } from "@/contexts/ProfileContext";

interface DetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowType: "stay" | "dining" | "agenda" | "logistics";
  dayLabel: string;
  dateLabel: string;
  booking: {
    title: string;
    subtitle: string;
    confirmation?: string;
    price?: string;
    time?: string;
    cancellationDeadline?: string;
    cancellationLabel?: string;
    proTip?: string;
    amexFHR?: boolean;
    status?: "paid" | "hold" | "pending";
    prefMatch?: boolean;
  };
}

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

function getEmbedUrl(query: string): string {
  if (!MAPS_KEY) {
    // Fallback: no-key embed won't work, show placeholder
    return "";
  }
  return `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${encodeURIComponent(query)}&zoom=15&maptype=roadmap`;
}

function getCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days} days remaining`;
}

function getMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getDirectionsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export default function DetailPanel({ open, onOpenChange, rowType, dayLabel, dateLabel, booking }: DetailPanelProps) {
  const { getBestCard } = useProfile();

  const searchQuery = `${booking.title} ${booking.subtitle}`;
  const embedUrl = getEmbedUrl(searchQuery);

  const typeMap: Record<string, "flight" | "stay" | "dining" | "transit" | "site"> = {
    logistics: "flight",
    stay: "stay",
    dining: "dining",
    agenda: "site",
  };
  const bestCard = getBestCard(typeMap[rowType] || "stay");

  const statusLabel: Record<string, { text: string; style: string }> = {
    paid: { text: "Confirmed & Paid", style: "bg-forest/10 text-forest" },
    hold: { text: "On Hold", style: "bg-amber-100 text-amber-800" },
    pending: { text: "Pending", style: "bg-muted text-muted-foreground" },
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px] flex flex-col p-0 gap-0 border-l border-border">
        {/* Map Section */}
        <div className="relative w-full h-[200px] bg-muted overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map of ${booking.title}`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50">
              <MapPin className="w-8 h-8 text-primary/40 mb-2" strokeWidth={1} />
              <p className="text-[10px] font-body text-muted-foreground uppercase tracking-widest">
                Map Preview
              </p>
              <p className="text-[9px] font-body text-muted-foreground mt-1">
                Add VITE_GOOGLE_MAPS_KEY to enable
              </p>
            </div>
          )}
          {/* Floating location badge */}
          <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm rounded-sm px-3 py-1.5 shadow-sm border border-border/50">
            <p className="text-[9px] font-body font-medium uppercase tracking-widest text-muted-foreground">
              {rowType === "stay" ? "Property" : rowType === "dining" ? "Restaurant" : "Location"}
            </p>
            <p className="text-xs font-display font-medium text-foreground">{booking.title}</p>
          </div>
        </div>

        {/* Header */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-body font-bold uppercase tracking-widest text-primary">
              {rowType === "stay" ? "Accommodation" : rowType === "dining" ? "Dining" : rowType === "agenda" ? "Activity" : "Transport"}
            </span>
            {booking.status && statusLabel[booking.status] && (
              <span className={cn(
                "text-[8px] font-body font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                statusLabel[booking.status].style
              )}>
                {statusLabel[booking.status].text}
              </span>
            )}
          </div>
          <SheetTitle className="font-display text-lg font-medium tracking-tight text-foreground">
            {booking.title}
          </SheetTitle>
          <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            {dayLabel} · {dateLabel}
          </p>
        </SheetHeader>

        {/* Details */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Place Details Card */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-body font-medium text-foreground">{booking.subtitle}</p>
                {booking.time && (
                  <p className="text-[10px] font-body text-muted-foreground mt-0.5">{booking.time}</p>
                )}
              </div>
            </div>

            {booking.confirmation && (
              <div className="flex items-start gap-3">
                <Star className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] font-body text-muted-foreground uppercase tracking-widest">Confirmation</p>
                  <p className="text-xs font-body font-medium text-foreground tracking-wide">{booking.confirmation}</p>
                </div>
              </div>
            )}

            {booking.price && (
              <div className="flex items-start gap-3">
                <CreditCard className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] font-body text-muted-foreground uppercase tracking-widest">Rate</p>
                  <p className="text-xs font-body font-medium text-foreground">{booking.price}</p>
                </div>
              </div>
            )}

            {booking.cancellationDeadline && (
              <div className="flex items-start gap-3">
                <Clock className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] font-body text-muted-foreground uppercase tracking-widest">Cancellation Deadline</p>
                  <p className="text-xs font-body font-medium text-foreground">{booking.cancellationLabel}</p>
                  <p className="text-[10px] font-body text-primary font-medium mt-0.5">
                    {getCountdown(booking.cancellationDeadline)}
                  </p>
                </div>
              </div>
            )}

            {booking.amexFHR && (
              <div className="border border-primary/20 rounded-sm p-3 bg-primary/5">
                <p className="text-[9px] font-body font-bold uppercase tracking-widest text-primary mb-1">
                  Amex Fine Hotels + Resorts
                </p>
                <p className="text-[10px] font-body text-muted-foreground">
                  Daily breakfast, $200 experience credit, room upgrade, noon checkout.
                </p>
              </div>
            )}
          </div>

          {/* Thomas's Take */}
          {(booking.proTip || bestCard) && (
            <div className="border-t border-border pt-4">
              <p className="text-[9px] font-body font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Thomas's Take
              </p>
              {booking.proTip && (
                <p className="text-[10px] font-body text-foreground leading-relaxed">
                  {booking.proTip}
                </p>
              )}
              {bestCard && !booking.proTip?.includes(bestCard) && (
                <p className="text-[10px] font-body text-primary font-medium mt-1">
                  ✦ {bestCard}
                </p>
              )}
            </div>
          )}

          {booking.prefMatch && (
            <div className="border border-amber-200 rounded-sm p-3 bg-amber-50">
              <p className="text-[9px] font-body font-bold uppercase tracking-widest text-amber-800 mb-1">
                ✦ Profile Match
              </p>
              <p className="text-[10px] font-body text-amber-700">
                This property matches your preferences for spa, wellness, and fitness amenities.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-border px-6 py-4 space-y-2 bg-muted/20">
          <div className="grid grid-cols-3 gap-2">
            <a
              href={getDirectionsUrl(searchQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 py-3 rounded-sm border border-border bg-background hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <Navigation className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-[8px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                Directions
              </span>
            </a>
            <a
              href={getMapsSearchUrl(searchQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 py-3 rounded-sm border border-border bg-background hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-[8px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                Website
              </span>
            </a>
            <button
              className="flex flex-col items-center gap-1.5 py-3 rounded-sm border border-border bg-background hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <Pencil className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-[8px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                Edit
              </span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
