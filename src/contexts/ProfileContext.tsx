import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  profileLoading: boolean;
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
  totalSpent: 9375,
  nightsBooked: 27,
  splurgeCredit: 500,
};

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cards, setCards] = useState<RewardCard[]>(defaultCards);
  const [preferences, setPreferencesState] = useState<TravelPreferences>(defaultPrefs);
  const [budget, setBudget] = useState<BudgetData>(defaultBudget);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch profile from DB
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("travel_preferences, active_cards")
        .eq("id", user.id)
        .single();

      if (data) {
        if (data.travel_preferences) {
          setPreferencesState(data.travel_preferences as unknown as TravelPreferences);
        }
        if (data.active_cards && Array.isArray(data.active_cards) && (data.active_cards as any[]).length > 0) {
          setCards(data.active_cards as unknown as RewardCard[]);
        }
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [user]);

  const persistProfile = useCallback(async (prefs: TravelPreferences, cardData: RewardCard[]) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({
        travel_preferences: prefs as any,
        active_cards: cardData as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  }, [user]);

  const toggleCard = (id: string) => {
    setCards((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, owned: !c.owned } : c));
      persistProfile(preferences, updated);
      return updated;
    });
  };

  const setPreferences = (prefs: TravelPreferences) => {
    setPreferencesState(prefs);
    persistProfile(prefs, cards);
  };

  const getBestCard = (type: "flight" | "stay" | "dining" | "transit" | "site"): string => {
    const categoryMap: Record<string, string> = { flight: "flight", stay: "stay", dining: "dining", transit: "transit", site: "stay" };
    const cat = categoryMap[type] || "stay";
    const owned = cards.filter((c) => c.owned && c.categories.includes(cat));
    if (owned.length === 0) return "";
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
    <ProfileContext.Provider value={{ cards, toggleCard, preferences, setPreferences, budget, setBudget, getBestCard, matchesPreferences, profileLoading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
