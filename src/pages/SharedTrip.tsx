import SharedTripView from "@/components/SharedTripView";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SharedTrip() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
              Shared Trip
            </h1>
            <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase mt-0.5">
              Friend's itinerary
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <SharedTripView />
      </main>
    </div>
  );
}
