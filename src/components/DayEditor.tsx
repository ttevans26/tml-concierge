import { useState } from "react";
import { X, Plus, Trash2, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ActivityType = "restaurant" | "activity" | "event" | "note";
export type ActivityStatus = "draft" | "pinned" | "confirmed";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  time?: string;
  link?: string;
  status: ActivityStatus;
}

interface DayEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayLabel: string;
  dateLabel: string;
  items: ActivityItem[];
  onItemsChange: (items: ActivityItem[]) => void;
}

const typeColors: Record<ActivityType, string> = {
  restaurant: "border-l-forest",
  activity: "border-l-foreground",
  event: "border-l-primary",
  note: "border-l-muted-foreground",
};

const typeLabels: Record<ActivityType, string> = {
  restaurant: "Restaurant",
  activity: "Activity",
  event: "Event",
  note: "Note",
};

const statusStyles: Record<ActivityStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pinned: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-forest/10 text-forest",
};

export default function DayEditor({ open, onOpenChange, dayLabel, dateLabel, items, onItemsChange }: DayEditorProps) {
  const [newType, setNewType] = useState<ActivityType>("restaurant");
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newStatus, setNewStatus] = useState<ActivityStatus>("draft");

  const addItem = () => {
    if (!newTitle.trim()) return;
    const item: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: newType,
      title: newTitle.trim(),
      time: newTime || undefined,
      link: newLink || undefined,
      status: newStatus,
    };
    onItemsChange([...items, item]);
    setNewTitle("");
    setNewTime("");
    setNewLink("");
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter((i) => i.id !== id));
  };

  const cycleStatus = (id: string) => {
    const order: ActivityStatus[] = ["draft", "pinned", "confirmed"];
    onItemsChange(
      items.map((i) => {
        if (i.id !== id) return i;
        const next = order[(order.indexOf(i.status) + 1) % order.length];
        return { ...i, status: next };
      })
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="font-display text-lg font-medium tracking-tight text-foreground">
            {dayLabel}
          </SheetTitle>
          <p className="text-[11px] font-body text-muted-foreground tracking-widest uppercase">
            {dateLabel} · Day Editor
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {items.length === 0 && (
            <p className="text-xs font-body text-muted-foreground py-8 text-center">
              No items yet — add your first below.
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "border rounded-sm p-3 bg-background border-l-[3px] group",
                typeColors[item.type]
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-body font-bold uppercase tracking-widest text-muted-foreground">
                    {typeLabels[item.type]}
                  </span>
                  <button
                    onClick={() => cycleStatus(item.id)}
                    className={cn(
                      "text-[8px] font-body font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors",
                      statusStyles[item.status]
                    )}
                  >
                    {item.status}
                  </button>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-muted-foreground hover:text-forest transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                    </a>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-body font-medium text-foreground">{item.title}</p>
              {item.time && (
                <p className="text-[10px] font-body text-muted-foreground mt-0.5">{item.time}</p>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-border px-6 py-4 space-y-3 bg-muted/20">
          <p className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
            Add Item
          </p>

          <div className="flex gap-1">
            {(Object.keys(typeLabels) as ActivityType[]).map((t) => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={cn(
                  "text-[9px] font-body font-bold uppercase tracking-widest px-2 py-1 rounded-sm transition-colors border",
                  newType === t
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                )}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div>
              <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Dinner at Aux Envies"
                className="h-8 text-sm font-body mt-1"
                onKeyDown={(e) => e.key === "Enter" && addItem()}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">Time</Label>
                <Input
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="HH:MM"
                  className="h-8 text-sm font-body mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">Status</Label>
                <div className="flex gap-1 mt-1">
                  {(["draft", "pinned", "confirmed"] as ActivityStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={cn(
                        "text-[8px] font-body font-bold uppercase tracking-widest px-1.5 py-1 rounded-sm transition-colors",
                        newStatus === s ? statusStyles[s] : "bg-background text-muted-foreground border border-border"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">Link</Label>
              <Input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Google Maps or Resy URL"
                className="h-8 text-sm font-body mt-1"
              />
            </div>
          </div>

          <button
            onClick={addItem}
            disabled={!newTitle.trim()}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-background bg-foreground rounded-sm px-3 py-2 hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" strokeWidth={2} />
            Add to Day
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
