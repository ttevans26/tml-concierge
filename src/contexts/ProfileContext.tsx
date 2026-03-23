import { createContext, useContext, useState, ReactNode } from "react";

export interface RewardCard {
  id: string;
  name: string;
  shortName: string;
  earn: string;
  categories: string[];
  owned: boolean;
}

export interface TravelPreferences {
  adultsOnly: boolean;
  saunaGym: boolean;
  spa: boolean;
  targetNightlyRate: number;
}

export interface BudgetData {
  totalSpent: number;
  nightsBooked: number;
  splurgeCredit: number;
}

interface ProfileContextType {
  cards: RewardCard[];
  toggleCard: (id: string) => void;
  preferences: TravelPreferences;
  setPreferences: (prefs: TravelPreferences) => void;
  budget: BudgetData;
  setBudget: (b: BudgetData) => void;
  getBestCard: (type: "flight" | "stay" | "dining" | "transit" | "site") => string;
  matchesPreferences: (tags: string[]) => string[];
}

const defaultCards: RewardCard[] = [
  { id: "amex-plat", name: "Amex Platinum", shortName: "Amex Plat", earn: "5x", categories: ["flight"], owned: true },
  { id: "csr", name: "Chase Sapphire Reserve", shortName: "CSR", earn: "3x", categories: ["dining", "transit", "stay"], owned: true },
  { id: "amex-gold", name: "Amex Gold", shortName: "Amex Gold", earn: "4x", categories: ["dining"], owned: false },
  { id: "venture-x", name: "Capital One Venture X", shortName: "Venture X", earn: "2x", categories: ["flight", "stay", "dining", "transit"], owned: false },
];

const defaultPrefs: TravelPreferences = {
  adultsOnly: false,
  saunaGym: true,
  spa: true,
  targetNightlyRate: 400,
};

const defaultBudget: BudgetData = {
  totalSpent: 4280,
  nightsBooked: 8,
  splurgeCredit: 320,
};

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<RewardCard[]>(defaultCards);
  const [preferences, setPreferences] = useState<TravelPreferences>(defaultPrefs);
  const [budget, setBudget] = useState<BudgetData>(defaultBudget);

  const toggleCard = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, owned: !c.owned } : c)));
  };

  const getBestCard = (type: "flight" | "stay" | "dining" | "transit" | "site"): string => {
    const categoryMap: Record<string, string> = { flight: "flight", stay: "stay", dining: "dining", transit: "transit", site: "stay" };
    const cat = categoryMap[type] || "stay";
    const owned = cards.filter((c) => c.owned && c.categories.includes(cat));
    if (owned.length === 0) return "";
    // Pick highest earn
    owned.sort((a, b) => parseInt(b.earn) - parseInt(a.earn));
    return `Use ${owned[0].name} for ${owned[0].earn} points`;
  };

  const matchesPreferences = (tags: string[]): string[] => {
    const matches: string[] = [];
    const lower = tags.map((t) => t.toLowerCase());
    if (preferences.saunaGym && lower.some((t) => t.includes("sauna") || t.includes("gym") || t.includes("fitness"))) {
      matches.push("Sauna/Gym");
    }
    if (preferences.spa && lower.some((t) => t.includes("spa") || t.includes("thermal") || t.includes("wellness"))) {
      matches.push("Spa");
    }
    if (preferences.adultsOnly && lower.some((t) => t.includes("adults only") || t.includes("adult-only"))) {
      matches.push("Adults Only");
    }
    return matches;
  };

  return (
    <ProfileContext.Provider value={{ cards, toggleCard, preferences, setPreferences, budget, setBudget, getBestCard, matchesPreferences }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
