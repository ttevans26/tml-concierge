import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

export default function ExpertBridge() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-forest text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] font-body text-sm font-medium tracking-wide"
      >
        <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
        Consult Thomas
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-background border border-border rounded-t-xl sm:rounded-xl shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="font-display text-lg font-medium text-foreground">TML Expert Bridge</h3>
                <p className="text-xs font-body text-muted-foreground mt-0.5">
                  Thomas is typically available within 2 hours
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Chat area */}
            <div className="p-5 h-64 overflow-y-auto">
              <div className="bg-secondary rounded-lg p-3.5 max-w-[85%] mb-4">
                <p className="text-sm font-body text-foreground">
                  Good afternoon. How can I assist with your upcoming travel? I can help with rebooking, upgrades, or restaurant reservations.
                </p>
                <span className="text-[10px] font-body text-muted-foreground mt-1.5 block">Thomas · TML Concierge</span>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about bookings, upgrades…"
                  className="flex-1 bg-secondary border-none rounded-md px-3.5 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-forest"
                />
                <button className="w-10 h-10 rounded-md bg-forest text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity">
                  <Send className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
