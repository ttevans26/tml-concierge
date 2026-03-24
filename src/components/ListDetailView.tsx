import { Hotel, Utensils, Compass, MapPin, GripVertical, Star } from "lucide-react";
import type { LocationList, VaultItem } from "./LocationVault";

interface ListDetailViewProps {
  list: LocationList;
}

const CATEGORIES: { key: VaultItem["type"]; label: string; icon: typeof Hotel }[] = [
  { key: "hotel", label: "Hotels & Stays", icon: Hotel },
  { key: "restaurant", label: "Restaurants & Dining", icon: Utensils },
  { key: "activity", label: "Activities & Culture", icon: Compass },
  { key: "logistics", label: "Logistics & Transport", icon: MapPin },
];

function ItemCard({ item }: { item: VaultItem }) {
  return (
    <div
      draggable
      className="group relative flex gap-4 p-4 rounded-sm border border-border bg-background hover:border-forest/30 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
    >
      {/* Image */}
      {item.imageUrl ? (
        <div className="w-[120px] h-[80px] rounded-sm overflow-hidden shrink-0 bg-secondary">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-[120px] h-[80px] rounded-sm shrink-0 bg-secondary flex items-center justify-center">
          <MapPin className="w-5 h-5 text-muted-foreground/40" strokeWidth={1.5} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <GripVertical className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
          <h4 className="font-display text-[14px] font-medium text-foreground leading-snug truncate">
            {item.title}
          </h4>
        </div>
        <p className="text-[11px] font-body text-muted-foreground leading-relaxed">
          {item.subtitle}
        </p>

        {/* Google Rating */}
        {item.rating && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.floor(item.rating!)
                      ? "text-amber-500 fill-amber-500"
                      : star - 0.5 <= item.rating!
                      ? "text-amber-500 fill-amber-500/50"
                      : "text-border"
                  }`}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="text-[11px] font-body font-medium text-foreground">{item.rating}</span>
            {item.reviewCount && (
              <span className="text-[10px] font-body text-muted-foreground">
                ({item.reviewCount.toLocaleString()})
              </span>
            )}
            {item.priceLevel && (item.type === "hotel" || item.type === "restaurant") && (
              <span className="text-[10px] font-body font-semibold text-forest ml-1.5">
                {"$".repeat(item.priceLevel)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Drag to Trip action */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-body font-bold uppercase tracking-widest text-forest bg-forest/10 px-2 py-1 rounded-sm">
          Drag to Trip
        </span>
      </div>
    </div>
  );
}

export default function ListDetailView({ list }: ListDetailViewProps) {
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: list.items.filter((i) => i.type === cat.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <p className="text-[9px] font-body font-semibold uppercase tracking-[0.15em] text-forest mb-1">
          {list.region}
        </p>
        <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
          {list.name}
        </h2>
        <p className="text-[11px] font-body text-muted-foreground mt-1">
          {list.items.length} curated ideas · Drag cards to your trip timeline
        </p>
      </div>

      {/* Categorized Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
        {grouped.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.key}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-3.5 h-3.5 text-forest" strokeWidth={1.5} />
                <h3 className="text-[10px] font-body font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {group.label}
                </h3>
                <span className="text-[9px] font-body font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                  {group.items.length}
                </span>
                <div className="flex-1 border-t border-border ml-2" />
              </div>
              <div className="space-y-2.5">
                {group.items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
