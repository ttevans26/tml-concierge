import { useState } from "react";
import { X, Clock, ArrowRight, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "2:00 PM", "2:30 PM", "3:00 PM", "4:00 PM",
];

interface ExpertBridgeProps {
  onClose: () => void;
}

export default function ExpertBridge({ onClose }: ExpertBridgeProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [agenda, setAgenda] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-sm shadow-2xl animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h3 className="font-display text-lg font-medium text-foreground">
              Schedule a Consultation
            </h3>
            <p className="text-xs font-body text-muted-foreground mt-0.5 tracking-wide">
              Thomas Müller-Larsen · Private Travel Advisor
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {confirmed ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-5 h-5 text-forest" strokeWidth={1.5} />
            </div>
            <h4 className="font-display text-xl font-medium text-foreground mb-1">
              Consultation Confirmed
            </h4>
            <p className="text-sm font-body text-muted-foreground max-w-xs mx-auto">
              {format(selectedDate!, "EEEE, MMMM d, yyyy")} at {selectedTime}
            </p>
            <p className="text-xs font-body text-muted-foreground mt-4">
              Thomas will follow up via email within 24 hours.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {/* Left: Calendar */}
            <div className="p-5 flex flex-col items-center">
              <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase mb-3 self-start">
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
                  nav_button: "h-7 w-7 bg-transparent border border-border rounded-sm p-0 opacity-60 hover:opacity-100 transition-opacity inline-flex items-center justify-center",
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
            <div className="p-5 flex flex-col min-h-[320px]">
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
    </div>
  );
}
