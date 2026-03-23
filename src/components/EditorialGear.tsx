import { ExternalLink } from "lucide-react";

interface GearItem {
  name: string;
  brand: string;
  price: string;
  category: string;
  description: string;
  link: string;
}

const gearItems: GearItem[] = [
  {
    name: "Carry-On Pro",
    brand: "Monos",
    price: "$295",
    category: "Luggage",
    description: "Polycarbonate shell, TSA lock, 360° wheels. The only carry-on Thomas packs.",
    link: "#",
  },
  {
    name: "Summer Walk Loafers",
    brand: "Loro Piana",
    price: "$895",
    category: "Footwear",
    description: "Calfskin suede, memory foam insole. Perfect for cobblestone cities.",
    link: "#",
  },
  {
    name: "Merino Travel Tee",
    brand: "Outlier",
    price: "$125",
    category: "Apparel",
    description: "Ultrafine merino wool, odor-resistant. Pack 3 for a 28-day trip.",
    link: "#",
  },
  {
    name: "Packable Day Bag",
    brand: "Aer",
    price: "$89",
    category: "Bags",
    description: "20L ripstop nylon, folds flat. Day hikes to museum days.",
    link: "#",
  },
  {
    name: "Noise-Cancelling 1000XM5",
    brand: "Sony",
    price: "$348",
    category: "Tech",
    description: "30-hour battery, multipoint Bluetooth. Essential for TGV & flights.",
    link: "#",
  },
  {
    name: "Travel Dopp Kit",
    brand: "Aesop",
    price: "$65",
    category: "Grooming",
    description: "Departure kit: shampoo, conditioner, body wash. TSA-friendly sizes.",
    link: "#",
  },
];

export default function EditorialGear() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {gearItems.map((item) => (
        <div
          key={item.name}
          className="border border-border rounded-md p-5 bg-background hover:border-forest/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted-foreground">
              {item.category}
            </span>
            <span className="text-xs font-body font-semibold text-foreground">
              {item.price}
            </span>
          </div>
          <h4 className="font-display text-base font-medium text-foreground mb-0.5">
            {item.name}
          </h4>
          <p className="text-[11px] font-body font-medium text-forest mb-2">
            {item.brand}
          </p>
          <p className="text-xs font-body text-muted-foreground leading-relaxed mb-4">
            {item.description}
          </p>
          <a
            href={item.link}
            className="inline-flex items-center gap-1.5 text-[10px] font-body font-medium uppercase tracking-widest text-forest hover:underline underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            View <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
          </a>
        </div>
      ))}
    </div>
  );
}
