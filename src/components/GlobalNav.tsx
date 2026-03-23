import { NavLink } from "react-router-dom";
import { useState } from "react";
import { CalendarDays, Bell, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import ExpertBridge from "./ExpertBridge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/trips", label: "Trips" },
  { to: "/studio", label: "Studio" },
  { to: "/tools", label: "Tools" },
];

export default function GlobalNav() {
  const [showScheduler, setShowScheduler] = useState(false);
  const [hasNotification] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

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
              className="flex items-center gap-2 bg-forest text-primary-foreground px-4 py-2 rounded-md text-xs font-body font-medium tracking-wide hover:opacity-90 transition-opacity"
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
                    "px-4 py-2 text-xs font-body font-medium tracking-widest uppercase transition-colors rounded-md",
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
            <button className="relative w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              {hasNotification && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-forest rounded-full" />
              )}
            </button>
            <button
              onClick={() => setProfileOpen(true)}
              className="w-8 h-8 rounded-full bg-forest text-primary-foreground flex items-center justify-center text-xs font-body font-medium hover:opacity-90 transition-opacity"
            >
              TM
            </button>
          </div>
        </div>
      </header>

      {/* Profile Drawer */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle className="font-display">Profile</SheetTitle>
            <SheetDescription className="font-body">Manage your account</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-forest text-primary-foreground flex items-center justify-center text-sm font-body font-semibold">
                TM
              </div>
              <div>
                <p className="text-sm font-body font-medium text-foreground">Thomas M.</p>
                <p className="text-xs font-body text-muted-foreground">Premium Member</p>
              </div>
            </div>

            <Separator />

            {/* Profile Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-forest" strokeWidth={1.5} />
                <span className="text-xs font-body font-medium uppercase tracking-widest text-muted-foreground">
                  Profile Settings
                </span>
              </div>
              <div className="space-y-2">
                {["Rewards Wallet", "Travel Preferences", "Notifications"].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setProfileOpen(false);
                      if (item === "Rewards Wallet" || item === "Travel Preferences") {
                        window.location.href = "/profile";
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-body text-foreground rounded-md hover:bg-secondary transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Social */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-forest" strokeWidth={1.5} />
                <span className="text-xs font-body font-medium uppercase tracking-widest text-muted-foreground">
                  Social
                </span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/shared/europe-2026`;
                    navigator.clipboard.writeText(shareUrl);
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-body text-forest font-medium rounded-md hover:bg-forest/5 transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Share Trip
                </button>
                {["Shared Trips", "Travel Friends", "Invite Someone"].map((item) => (
                  <button
                    key={item}
                    className="w-full text-left px-3 py-2 text-sm font-body text-foreground rounded-md hover:bg-secondary transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {showScheduler && <ExpertBridge onClose={() => setShowScheduler(false)} />}
    </>
  );
}
