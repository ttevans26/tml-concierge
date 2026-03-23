import { useState } from "react";
import { UserPlus, Check, X } from "lucide-react";

interface FriendReq {
  id: string;
  name: string;
  initials: string;
  mutualTrips: string[];
}

const mockRequests: FriendReq[] = [
  {
    id: "fr1",
    name: "Elena Marchetti",
    initials: "EM",
    mutualTrips: ["Venice & Dolomites Sep 2026"],
  },
];

export default function FriendRequest() {
  const [requests, setRequests] = useState<FriendReq[]>(mockRequests);
  const [approved, setApproved] = useState<string[]>([]);

  function handleApprove(id: string) {
    setApproved((prev) => [...prev, id]);
    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }, 1500);
  }

  function handleDecline(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  if (requests.length === 0) return null;

  return (
    <section className="w-full">
      <div className="border border-forest/30 rounded-md bg-forest/[0.03] overflow-hidden">
        {requests.map((req) => {
          const isApproved = approved.includes(req.id);
          return (
            <div key={req.id} className="p-5 flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-forest text-primary-foreground flex items-center justify-center text-xs font-body font-semibold shrink-0">
                {req.initials}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                  <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
                    Friend Request
                  </span>
                </div>
                <p className="text-sm font-body text-foreground font-medium">
                  {req.name}
                  <span className="font-normal text-muted-foreground">
                    {" "}wants to connect
                  </span>
                </p>
                <p className="text-xs font-body text-muted-foreground mt-1">
                  Shared interest: {req.mutualTrips.join(", ")}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  {isApproved ? (
                    <span className="flex items-center gap-1.5 text-xs font-body font-medium text-forest">
                      <Check className="w-3.5 h-3.5" strokeWidth={2} />
                      Approved — they can now see your published trips
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex items-center gap-1.5 text-xs font-body font-medium bg-forest text-primary-foreground px-3.5 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                      >
                        <Check className="w-3 h-3" strokeWidth={2} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        className="flex items-center gap-1.5 text-xs font-body font-medium text-muted-foreground border border-border px-3.5 py-1.5 rounded-full hover:bg-secondary transition-colors"
                      >
                        <X className="w-3 h-3" strokeWidth={2} />
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
