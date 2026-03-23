import { useState } from "react";
import { CreditCard, CalendarDays, Clock, ArrowRight, Check, X, Briefcase, ClipboardCheck, Square, CheckSquare } from "lucide-react";
import EditorialGear from "@/components/EditorialGear";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

/* ── Points Optimizer ── */
const pointsData = [
  {
    card: "Amex Platinum",
    earn: "5x",
    category: "Flights booked directly or via Amex Travel",
    best: "Flights, Amex FHR Hotels",
    color: "bg-foreground text-background",
  },
  {
    card: "Chase Sapphire Reserve",
    earn: "3x",
    category: "Dining, transit & general travel",
    best: "Restaurants, Rental Cars, Rail",
    color: "bg-forest text-primary-foreground",
  },
  {
    card: "Amex Gold",
    earn: "4x",
    category: "Restaurants & US supermarkets",
    best: "Dining (domestic)",
    color: "bg-amber-700 text-primary-foreground",
  },
  {
    card: "Capital One Venture X",
    earn: "2x",
    category: "All purchases",
    best: "Catch-all spending",
    color: "bg-muted-foreground text-background",
  },
];

/* ── Pre-Travel Checklist ── */
const checklistItems = [
  { id: "restrictions", label: "Have you looked into any new travel restrictions?" },
  { id: "drivers-permit", label: "Do you have your Italian driver's permit?" },
  { id: "rail-pass", label: "Did you buy your TGV rail pass?" },
  { id: "laundry", label: "Have you figured out when and where you will do laundry?" },
  { id: "adapters", label: "Do you have the necessary travel electronic adapters?" },
];

/* ── Scheduler ── */
const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "2:00 PM", "2:30 PM", "3:00 PM", "4:00 PM",
];

export default function Tools() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [agenda, setAgenda] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const resetScheduler = () => {
    setSelectedDate(undefined);
    setSelectedTime(null);
    setAgenda("");
    setConfirmed(false);
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* ── Points Optimizer ── */}
        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <CreditCard className="w-4 h-4 text-forest" strokeWidth={1.5} />
            <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
              Points Optimizer
            </h2>
          </div>

          <div className="border border-border rounded-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-5 py-3 text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                    Card
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                    Earn Rate
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                    Categories
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                    Best For
                  </th>
                </tr>
              </thead>
              <tbody>
                {pointsData.map((row) => (
                  <tr key={row.card} className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-body font-medium text-foreground">
                      {row.card}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-body font-bold px-2.5 py-1 rounded-sm ${row.color}`}>
                        {row.earn}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-body text-muted-foreground">
                      {row.category}
                    </td>
                    <td className="px-5 py-4 text-sm font-body text-foreground font-medium">
                      {row.best}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Human Scheduler ── */}
        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <CalendarDays className="w-4 h-4 text-forest" strokeWidth={1.5} />
            <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
              Schedule a Consultation
            </h2>
            <span className="text-xs font-body text-muted-foreground ml-2">
              Thomas Müller-Larsen · Private Travel Advisor
            </span>
          </div>

          <div className="border border-border rounded-sm overflow-hidden">
            {confirmed ? (
              <div className="px-6 py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-5 h-5 text-forest" strokeWidth={1.5} />
                </div>
                <h4 className="font-display text-xl font-medium text-foreground mb-1">
                  Consultation Confirmed
                </h4>
                <p className="text-sm font-body text-muted-foreground">
                  {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                </p>
                <p className="text-xs font-body text-muted-foreground mt-4">
                  Thomas will follow up via email within 24 hours.
                </p>
                <button
                  onClick={resetScheduler}
                  className="mt-6 text-xs font-body font-medium text-forest hover:underline underline-offset-4"
                >
                  Book Another
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {/* Left: Calendar */}
                <div className="p-6 flex flex-col items-center">
                  <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase mb-4 self-start">
                    Select a Date
                  </p>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                      setAgenda("");
                    }}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    className={cn("p-0 pointer-events-auto")}
                    classNames={{
                      months: "flex flex-col",
                      month: "space-y-3",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-display font-medium text-foreground",
                      nav: "space-x-1 flex items-center",
                      nav_button:
                        "h-7 w-7 bg-transparent border border-border rounded-sm p-0 opacity-60 hover:opacity-100 transition-opacity inline-flex items-center justify-center",
                      nav_button_previous: "absolute left-0",
                      nav_button_next: "absolute right-0",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-sm w-9 font-body font-normal text-[0.7rem] uppercase tracking-wider",
                      row: "flex w-full mt-1",
                      cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-body font-normal text-foreground hover:bg-secondary rounded-sm transition-colors inline-flex items-center justify-center",
                      day_selected: "bg-forest text-primary-foreground hover:bg-forest hover:text-primary-foreground focus:bg-forest focus:text-primary-foreground",
                      day_today: "border border-border",
                      day_outside: "text-muted-foreground opacity-30",
                      day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
                      day_hidden: "invisible",
                    }}
                  />
                </div>

                {/* Right: Time Slots + Agenda */}
                <div className="p-6 flex flex-col min-h-[360px]">
                  {!selectedDate ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-sm font-body text-muted-foreground text-center">
                        Choose a date to view<br />available time slots.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase mb-3">
                        {format(selectedDate, "EEEE, MMM d")} — Available
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-auto">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-sm border text-sm font-body transition-all text-left",
                              selectedTime === slot
                                ? "border-forest bg-forest/5 text-foreground font-medium"
                                : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                            )}
                          >
                            <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                            {slot}
                          </button>
                        ))}
                      </div>

                      {selectedTime && (
                        <div className="mt-5 pt-5 border-t border-border animate-fade-in">
                          <label className="text-[11px] font-body text-muted-foreground tracking-widest uppercase block mb-2">
                            Consultation Agenda
                          </label>
                          <textarea
                            value={agenda}
                            onChange={(e) => setAgenda(e.target.value)}
                            placeholder="Venice logistics, Amex point strategy…"
                            rows={2}
                            className="w-full bg-secondary border-none rounded-sm px-3.5 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-forest resize-none"
                          />
                          <button
                            onClick={() => setConfirmed(true)}
                            className="mt-3 w-full flex items-center justify-center gap-2 bg-forest text-primary-foreground py-2.5 rounded-sm text-sm font-body font-medium hover:opacity-90 transition-opacity"
                          >
                            Confirm Booking
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
        {/* ── TML Editorial Gear ── */}
        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <Briefcase className="w-4 h-4 text-forest" strokeWidth={1.5} />
            <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
              TML Editorial Gear
            </h2>
            <span className="text-xs font-body text-muted-foreground ml-2">
              Curated by Thomas · Partner Collection
            </span>
          </div>
          <EditorialGear />
        </section>
      </div>
    </div>
  );
}
