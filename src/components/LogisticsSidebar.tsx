import { useState } from "react";
import { Clock, AlertTriangle, CreditCard, FileText, ExternalLink, Coffee, Dumbbell, Users, MapPin, CalendarDays, Shield, Check, Sparkles } from "lucide-react";
import type { DeadlineEntry } from "./MasterTimeline";
import type { TripData } from "@/lib/tripTransforms";
import { detectCompletion } from "@/lib/completionDetector";
import { cn } from "@/lib/utils";

/* ── Points Optimizer ── */
const pointsTips = [
  {
    card: "Amex Platinum",
    earn: "5x",
    categories: "Flights booked directly or via Amex Travel",
    color: "bg-foreground text-background",
  },
  {
    card: "Chase Sapphire Reserve",
    earn: "3x",
    categories: "Dining, transit & general travel",
    color: "bg-forest text-primary-foreground",
  },
  {
    card: "Amex Gold",
    earn: "4x",
    categories: "Restaurants & US supermarkets",
    color: "bg-amber-700 text-primary-foreground",
  },
];

/* ── Travel Wallet ── */
const documents = [
  { id: "doc-1", name: "Delta Boarding Pass", type: "PDF", ref: "DL7X9K2M" },
  { id: "doc-2", name: "Hertz Confirmation", type: "PDF", ref: "HZ-991-VCE" },
  { id: "doc-3", name: "Ryokan Sakaya Voucher", type: "PDF", ref: "RYK-8842-NZ" },
  { id: "doc-4", name: "Travel Insurance", type: "PDF", ref: "INS-2026-TML" },
];

/* ── Vibe Toggle ── */
type Vibe = "chill" | "active" | "social";
const vibeOptions: { key: Vibe; label: string; icon: typeof Coffee }[] = [
  { key: "chill", label: "Chill", icon: Coffee },
  { key: "active", label: "Active", icon: Dumbbell },
  { key: "social", label: "Social", icon: Users },
];

function getCountdown(deadline: string): { text: string; urgent: boolean } {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { text: "Expired", urgent: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 7) return { text: `${days}d`, urgent: false };
  return { text: `${days}d`, urgent: true };
}

const defaultDeadlines: DeadlineEntry[] = [
  {
    id: "dl-1",
    title: "Hertz — VCE Rental",
    type: "Rental",
    deadline: "2026-09-04T12:00:00",
    deadlineLabel: "Sep 4, 2026 at Noon",
  },
  {
    id: "dl-2",
    title: "Delta DL-178 — MXP → LAX",
    type: "Flight",
    deadline: "2026-09-15T23:59:00",
    deadlineLabel: "Sep 15, 2026",
  },
  {
    id: "dl-3",
    title: "Ryokan Sakaya — Nozawaonsen",
    type: "Stay",
    deadline: "2026-01-05T23:59:00",
    deadlineLabel: "Jan 5, 2026",
  },
];

interface LogisticsSidebarProps {
  extraDeadlines?: DeadlineEntry[];
}

export default function LogisticsSidebar({ extraDeadlines = [] }: LogisticsSidebarProps) {
  const [activeVibe, setActiveVibe] = useState<Vibe>("chill");

  const allDeadlines = [...defaultDeadlines, ...extraDeadlines];

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* ── Deadline Guard ── */}
      <div className="px-5 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
          <h3 className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
            Deadline Guard
          </h3>
          {extraDeadlines.length > 0 && (
            <span className="text-[9px] font-body font-bold uppercase tracking-widest bg-forest/10 text-forest px-1.5 py-0.5 rounded-sm ml-auto">
              +{extraDeadlines.length} New
            </span>
          )}
        </div>
        <div className="space-y-2">
          {allDeadlines.map((dl) => {
            const countdown = getCountdown(dl.deadline);
            const isNew = extraDeadlines.some((ed) => ed.id === dl.id);
            return (
              <div
                key={dl.id}
                className={`flex items-center justify-between py-2 px-3 border rounded-sm transition-all ${
                  isNew ? "border-forest/40 bg-forest/5 animate-fade-in" : "border-border"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-body font-medium text-foreground truncate">
                    {dl.title}
                  </p>
                  <p className="text-[10px] font-body text-muted-foreground">
                    {dl.deadlineLabel}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-body font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm shrink-0 ml-2 ${
                    countdown.urgent
                      ? "bg-destructive/10 text-destructive"
                      : "bg-forest/10 text-forest"
                  }`}
                >
                  {countdown.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Points Optimizer ── */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
          <h3 className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
            Points Optimizer
          </h3>
        </div>
        <div className="space-y-2">
          {pointsTips.map((tip) => (
            <div key={tip.card} className="flex items-start gap-3 py-2">
              <span className={`text-[10px] font-body font-bold px-2 py-1 rounded-sm shrink-0 ${tip.color}`}>
                {tip.earn}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-body font-medium text-foreground">{tip.card}</p>
                <p className="text-[10px] font-body text-muted-foreground leading-snug">{tip.categories}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Travel Wallet ── */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
          <h3 className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
            Travel Wallet
          </h3>
        </div>
        <div className="space-y-1.5">
          {documents.map((doc) => (
            <button
              key={doc.id}
              className="w-full flex items-center justify-between py-2 px-3 rounded-sm hover:bg-secondary transition-colors group text-left"
            >
              <div className="min-w-0">
                <p className="text-xs font-body font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-[10px] font-body text-muted-foreground">{doc.ref}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Vibe Toggle ── */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
          <h3 className="text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
            Map Vibe
          </h3>
        </div>
        <div className="flex gap-1.5">
          {vibeOptions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveVibe(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm text-[10px] font-body font-medium uppercase tracking-wider transition-all border ${
                activeVibe === key
                  ? "bg-forest text-primary-foreground border-forest"
                  : "bg-background text-muted-foreground border-border hover:border-forest/40"
              }`}
            >
              <Icon className="w-3 h-3" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Book Thomas ── */}
      <div className="mt-auto px-5 py-4 border-t border-border">
        <button className="w-full flex items-center justify-center gap-2 bg-forest text-primary-foreground py-2.5 rounded-sm text-xs font-body font-medium tracking-wide hover:opacity-90 transition-opacity">
          <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.5} />
          Book Thomas
        </button>
      </div>
    </div>
  );
}
