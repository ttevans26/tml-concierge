import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, X, Plane, MapPin, CreditCard, GripVertical } from "lucide-react";
import { useTripStore } from "@/stores/useTripStore";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface CardData {
  title: string;
  subtitle: string;
  type: "dining" | "stay" | "agenda" | "logistics";
  cost: number | null;
  time: string | null;
}

/* ── Build trip context string for the system prompt ── */
function buildTripContext(activeTrip: any, items: any[]): string {
  if (!activeTrip) return "No active trip.";
  const lines: string[] = [
    `Trip: ${activeTrip.title || activeTrip.destination || "Untitled"}`,
    `Dates: ${activeTrip.start_date} to ${activeTrip.end_date}`,
    `Budget: $${activeTrip.target_nightly_budget || 0}/night`,
    "",
    "Itinerary items:",
  ];
  const sorted = [...items].sort((a, b) => (a.day_index ?? 0) - (b.day_index ?? 0));
  for (const item of sorted) {
    lines.push(
      `  Day ${(item.day_index ?? 0) + 1} | ${item.type} | ${item.title || "—"} | ${item.subtitle || ""} | ${item.date || ""}`
    );
  }
  return lines.join("\n");
}

/* ── Parse CARD: lines from AI response ── */
function parseCards(text: string): { cleanText: string; cards: CardData[] } {
  const cards: CardData[] = [];
  const cleanLines: string[] = [];
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("CARD:")) {
      try {
        const json = JSON.parse(line.trim().slice(5));
        cards.push(json);
      } catch { /* skip malformed */ }
    } else {
      cleanLines.push(line);
    }
  }
  return { cleanText: cleanLines.join("\n").trim(), cards };
}

/* ── Quick action chips ── */
const quickActions = [
  { label: "Search Flights", icon: Plane, prompt: "Find me the best flight options for my next leg of the trip." },
  { label: "Nearby Dining", icon: MapPin, prompt: "Suggest a great dinner spot near my hotel tonight." },
  { label: "Optimize Points", icon: CreditCard, prompt: "Review my stays and suggest where I could use credit card points to save money." },
];

/* ── Streaming fetch ── */
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/concierge-chat`;

async function streamChat({
  messages,
  tripContext,
  onDelta,
  onDone,
  signal,
}: {
  messages: ChatMsg[];
  tripContext: string;
  onDelta: (t: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, tripContext }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { /* partial */ }
    }
  }
  onDone();
}

/* ── Draggable Card ── */
function ConciergeCard({ card }: { card: CardData }) {
  const typeColors: Record<string, string> = {
    dining: "border-l-rose-500",
    stay: "border-l-emerald-500",
    agenda: "border-l-amber-500",
    logistics: "border-l-blue-500",
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/concierge-card", JSON.stringify(card));
        e.dataTransfer.effectAllowed = "copy";
      }}
      className={cn(
        "flex items-start gap-2 p-3 mt-2 rounded-md border border-border bg-card cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md border-l-[3px]",
        typeColors[card.type] || "border-l-border"
      )}
    >
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-body font-medium text-foreground truncate">{card.title}</p>
        <p className="text-[10px] font-body text-muted-foreground truncate">{card.subtitle}</p>
        {card.time && (
          <span className="inline-block mt-1 text-[9px] font-body font-medium uppercase tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
            {card.time}
          </span>
        )}
      </div>
      <span className="text-[9px] font-body font-medium uppercase tracking-widest text-muted-foreground shrink-0">
        {card.type}
      </span>
    </div>
  );
}

/* ── Main Component ── */
export default function GeminiConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeTrip = useTripStore((s) => s.activeTrip);
  const items = useTripStore((s) => s.items);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: ChatMsg = { role: "user", content: text.trim() };
      const history = [...messages, userMsg];
      setMessages(history);
      setInput("");
      setLoading(true);

      let assistantSoFar = "";
      const controller = new AbortController();
      abortRef.current = controller;

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        await streamChat({
          messages: history,
          tripContext: buildTripContext(activeTrip, items),
          onDelta: upsert,
          onDone: () => setLoading(false),
          signal: controller.signal,
        });
      } catch (e: any) {
        if (e.name !== "AbortError") {
          upsert(`\n\n_Error: ${e.message}_`);
        }
        setLoading(false);
      }
    },
    [messages, loading, activeTrip, items]
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Open Concierge"
        >
          <Sparkles className="w-5 h-5" strokeWidth={1.5} />
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-y-0 right-0 z-50 w-[380px] max-w-full flex flex-col border-l border-border bg-[hsl(43,33%,98%)] shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <h2 className="font-display text-sm font-medium text-foreground tracking-wide">Concierge Consultant</h2>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
                <p className="text-xs font-body text-muted-foreground">
                  Ask me anything about your trip.
                </p>
                {activeTrip && (
                  <p className="text-[10px] font-body text-muted-foreground/60 mt-1">
                    Viewing: {activeTrip.title || activeTrip.destination}
                  </p>
                )}
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] bg-primary text-primary-foreground px-3.5 py-2 rounded-lg rounded-br-sm text-xs font-body leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                );
              }
              const { cleanText, cards } = parseCards(msg.content);
              return (
                <div key={i} className="max-w-[92%]">
                  <div className="text-xs font-body text-foreground leading-relaxed whitespace-pre-wrap">
                    {cleanText}
                  </div>
                  {cards.map((card, ci) => (
                    <ConciergeCard key={ci} card={card} />
                  ))}
                </div>
              );
            })}

            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-1.5 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse [animation-delay:300ms]" />
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="px-5 py-2 border-t border-border flex gap-1.5 overflow-x-auto">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => send(qa.prompt)}
                disabled={loading}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-border text-[10px] font-body font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <qa.icon className="w-3 h-3" strokeWidth={1.5} />
                {qa.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-5 py-3 border-t border-border">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask the concierge…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-xs font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none leading-relaxed py-1.5"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="shrink-0 w-7 h-7 rounded-sm bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
