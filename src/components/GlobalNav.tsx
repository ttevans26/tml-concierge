import { NavLink } from "react-router-dom";
import { useState } from "react";
import { CalendarDays, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import ExpertBridge from "./ExpertBridge";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/trips", label: "Trips" },
  { to: "/studio", label: "Studio" },
  { to: "/tools", label: "Tools" },
];

export default function GlobalNav() {
  const [showScheduler, setShowScheduler] = useState(false);
  const [hasNotification] = useState(true);

  return (
    <>
      <header className="border-b border-border bg-background shrink-0">
        <div className="px-8 h-14 flex items-center justify-between">
          {/* Left: brand + Book Thomas */}
          <div className="flex items-center gap-6">
            <div>
              <h1 className="font-display text-lg font-semibold tracking-tight text-foreground leading-none">
                TML Concierge
              </h1>
              <p className="text-[9px] font-body text-muted-foreground tracking-[0.2em] uppercase">
                Travel · Logistics · Lifestyle
              </p>
            </div>
            <button
              onClick={() => setShowScheduler(true)}
              className="flex items-center gap-2 bg-forest text-primary-foreground px-4 py-2 rounded-sm text-xs font-body font-medium tracking-wide hover:opacity-90 transition-opacity"
            >
              <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.5} />
              Book Thomas
            </button>
          </div>

          {/* Center: nav tabs */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "px-4 py-2 text-xs font-body font-medium tracking-widest uppercase transition-colors rounded-sm",
                    isActive
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: notification bell + avatar */}
          <div className="flex items-center gap-3">
            <button className="relative w-8 h-8 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              {hasNotification && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-forest rounded-full" />
              )}
            </button>
            <div className="w-8 h-8 rounded-sm bg-forest text-primary-foreground flex items-center justify-center text-xs font-body font-medium">
              TM
            </div>
          </div>
        </div>
      </header>

      {showScheduler && <ExpertBridge onClose={() => setShowScheduler(false)} />}
    </>
  );
}
