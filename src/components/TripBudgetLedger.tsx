import { useMemo } from "react";
import { Hotel, Plane, Ticket } from "lucide-react";

interface Booking {
  title: string;
  subtitle: string;
  confirmation?: string;
  price?: string;
  time?: string;
  status?: "paid" | "hold" | "pending";
}

interface TripRow {
  label: string;
  type: "logistics" | "stay" | "agenda" | "dining";
  cells: (Booking | null)[];
}

interface TripBudgetLedgerProps {
  rows: TripRow[];
  dayLabels: string[];
}

interface LedgerItem {
  name: string;
  detail: string;
  quantity: number;
  unitLabel: string;
  unitCost: number;
  total: number;
  status?: "paid" | "hold" | "pending";
  paymentStatus: "paid" | "pay-at-hotel" | "partial" | "rewards" | "pending";
}

// Known rates fallback
const KNOWN_RATES: Record<string, number> = {
  "queens arms": 185, "roseate villa": 310, "hotel l'ormaie": 420,
  "hotel sous les figuiers": 375, "la villa port d'antibes": 350,
  "hotel accademia": 280, "adler spa resort": 620, "hotel bella riva": 290,
  "sempione boutique hotel": 195,
};

function parseRate(price?: string): number | null {
  if (!price) return null;
  const m = price.match(/\$?([\d,]+)/);
  return m ? parseInt(m[1].replace(",", "")) : null;
}

function formatCurrency(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

export default function TripBudgetLedger({ rows, dayLabels }: TripBudgetLedgerProps) {
  const { accommodations, transport, experiences } = useMemo(() => {
    const accommodations: LedgerItem[] = [];
    const transport: LedgerItem[] = [];
    const experiences: LedgerItem[] = [];

    // ── Accommodations: group consecutive stay cells by hotel name ──
    const stayRow = rows.find((r) => r.type === "stay");
    if (stayRow) {
      let i = 0;
      while (i < stayRow.cells.length) {
        const cell = stayRow.cells[i];
        if (cell) {
          const hotelName = cell.title;
          let nights = 1;
          while (i + nights < stayRow.cells.length && stayRow.cells[i + nights]?.title === hotelName) nights++;
          const rate = parseRate(cell.price) || KNOWN_RATES[hotelName.toLowerCase()] || 350;
          accommodations.push({
            name: hotelName,
            detail: cell.subtitle?.split("·")[0]?.trim() || "",
            quantity: nights,
            unitLabel: nights === 1 ? "night" : "nights",
            unitCost: rate,
            total: rate * nights,
            status: cell.status,
          });
          i += nights;
        } else {
          i++;
        }
      }
    }

    // ── Transport: all logistics cells ──
    const logisticsRow = rows.find((r) => r.type === "logistics");
    if (logisticsRow) {
      logisticsRow.cells.forEach((cell) => {
        if (!cell) return;
        // Estimate transport costs heuristically
        const title = cell.title.toLowerCase();
        let cost = 0;
        if (title.includes("eurostar")) cost = 320;
        else if (title.includes("tgv")) cost = 180;
        else if (title.includes("flight") || title.includes("easyjet")) cost = 150;
        else if (title.includes("train") || title.includes("ter")) cost = 85;
        else if (title.includes("transfer") || title.includes("private")) cost = 120;
        else cost = 100;

        transport.push({
          name: cell.title,
          detail: cell.subtitle || "",
          quantity: 1,
          unitLabel: "ticket",
          unitCost: cost,
          total: cost,
        });
      });
    }

    // ── Experiences: agenda items that look like ticketed events ──
    const agendaRow = rows.find((r) => r.type === "agenda");
    if (agendaRow) {
      agendaRow.cells.forEach((cell) => {
        if (!cell) return;
        const title = cell.title.toLowerCase();
        // Only include things that are likely ticketed
        if (title.includes("opera") || title.includes("arena") || title.includes("museum") ||
            title.includes("castle") || title.includes("baths") || title.includes("boat") ||
            title.includes("tour") || title.includes("hike")) {
          let cost = 0;
          if (title.includes("opera") || title.includes("arena")) cost = 180;
          else if (title.includes("museum") || title.includes("musée")) cost = 25;
          else if (title.includes("castle") || title.includes("baths")) cost = 35;
          else if (title.includes("boat") || title.includes("borromean")) cost = 45;
          else if (title.includes("tour")) cost = 60;
          else if (title.includes("hike")) cost = 75;
          else cost = 40;

          experiences.push({
            name: cell.title,
            detail: cell.subtitle || "",
            quantity: 1,
            unitLabel: "ticket",
            unitCost: cost,
            total: cost,
          });
        }
      });
    }

    return { accommodations, transport, experiences };
  }, [rows]);

  const accomTotal = accommodations.reduce((s, i) => s + i.total, 0);
  const transportTotal = transport.reduce((s, i) => s + i.total, 0);
  const experienceTotal = experiences.reduce((s, i) => s + i.total, 0);
  const grandTotal = accomTotal + transportTotal + experienceTotal;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Ledger Title */}
        <div className="mb-10">
          <h2 className="font-display text-2xl font-medium text-foreground tracking-tight">
            Trip Budget Ledger
          </h2>
          <p className="text-xs font-body text-muted-foreground mt-1 tracking-wide">
            Financial summary · {dayLabels.length} days · Auto-synced from itinerary
          </p>
        </div>

        {/* ── Accommodations ── */}
        <LedgerSection
          icon={<Hotel className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />}
          title="Accommodations"
          items={accommodations}
          subtotal={accomTotal}
          emptyMessage="No stays added yet — drag from Studio to populate."
        />

        {/* ── Transport & Rentals ── */}
        <LedgerSection
          icon={<Plane className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />}
          title="Transport & Rentals"
          items={transport}
          subtotal={transportTotal}
          emptyMessage="No transport added yet — drag from Studio to populate."
        />

        {/* ── Experience & Misc ── */}
        <LedgerSection
          icon={<Ticket className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />}
          title="Experience & Misc"
          items={experiences}
          subtotal={experienceTotal}
          emptyMessage="No tickets added yet — drag from Studio to populate."
        />

        {/* ── Grand Total ── */}
        <div className="mt-10 pt-6 border-t-2 border-foreground">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg font-medium text-foreground">
              Total Trip Investment
            </span>
            <span className="font-mono text-xl font-semibold text-foreground tabular-nums tracking-tight">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LedgerSection({
  icon,
  title,
  items,
  subtotal,
  emptyMessage,
}: {
  icon: React.ReactNode;
  title: string;
  items: LedgerItem[];
  subtotal: number;
  emptyMessage: string;
}) {
  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 mb-4">
        {icon}
        <h3 className="font-display text-base font-medium text-foreground">
          {title}
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="text-xs font-body text-muted-foreground italic py-6 text-center border border-dashed border-border rounded-sm">
          {emptyMessage}
        </p>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_100px_110px] bg-muted/30 border-b border-border">
            <div className="px-4 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
              Item
            </div>
            <div className="px-3 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground text-right">
              Qty
            </div>
            <div className="px-3 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground text-right">
              Rate
            </div>
            <div className="px-4 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground text-right">
              Total
            </div>
          </div>

          {/* Rows */}
          {items.map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="grid grid-cols-[1fr_80px_100px_110px] border-b border-border last:border-b-0 hover:bg-muted/10 transition-colors"
            >
              <div className="px-4 py-3">
                <p className="text-xs font-body font-medium text-foreground">{item.name}</p>
                <p className="text-[10px] font-body text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
              <div className="px-3 py-3 flex items-center justify-end">
                <span className="font-mono text-xs text-foreground tabular-nums">
                  {item.quantity} {item.unitLabel}
                </span>
              </div>
              <div className="px-3 py-3 flex items-center justify-end">
                <span className="font-mono text-xs text-foreground tabular-nums">
                  {formatCurrency(item.unitCost)}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-end gap-2">
                {item.status && (
                  <span className={`text-[8px] font-body font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                    item.status === "paid" ? "bg-forest/10 text-forest" : "bg-amber-500/10 text-amber-700"
                  }`}>
                    {item.status}
                  </span>
                )}
                <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                  {formatCurrency(item.total)}
                </span>
              </div>
            </div>
          ))}

          {/* Subtotal */}
          <div className="grid grid-cols-[1fr_80px_100px_110px] bg-muted/20 border-t border-border">
            <div className="px-4 py-2.5 text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
              Subtotal
            </div>
            <div />
            <div />
            <div className="px-4 py-2.5 text-right">
              <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
