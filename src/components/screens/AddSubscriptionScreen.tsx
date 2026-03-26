import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import { Subscription } from "@/types/subscription";
import { toast } from "sonner";

import chatgptLogo from "@/assets/chatgpt-logo.png";
import tradingviewLogo from "@/assets/tradingview-logo.png";
import netflixLogo from "@/assets/netflix-logo.png";
import spotifyLogo from "@/assets/spotify-logo.png";
import geminiLogo from "@/assets/gemini-logo.png";

interface Props {
  onAdd: (sub: Omit<Subscription, "id">) => void;
  onNavigate: (tab: string) => void;
}

const categories = ["Streaming", "Music", "Cloud", "Shopping", "Gaming", "Productivity", "AI", "Finance", "Other"];

const popularSubscriptions = [
  { name: "ChatGPT", cost: 20.00, category: "AI", color: "#10A37F", logo: chatgptLogo },
  { name: "TradingView", cost: 14.95, category: "Finance", color: "#131722", logo: tradingviewLogo },
  { name: "Netflix", cost: 15.49, category: "Streaming", color: "#E50914", logo: netflixLogo },
  { name: "Spotify", cost: 11.99, category: "Music", color: "#1DB954", logo: spotifyLogo },
  { name: "Gemini", cost: 19.99, category: "AI", color: "#4285F4", logo: geminiLogo },
];

const CUSTOM_SUGGESTIONS_KEY = "custom-subscription-suggestions";

type SuggestionEntry = {
  name: string;
  cost: number;
  category: string;
  color: string;
  logo: string;
};

type StoredCustomSuggestion = {
  name: string;
  logo: string;
  cost: number;
  category: string;
  color?: string;
};

type PaymentMethod = {
  id: string;
  type: "visa" | "mastercard";
  name: string;
  last4: string;
  logoUrl?: string;
};

function loadPaymentMethods(): PaymentMethod[] {
  try {
    const raw = localStorage.getItem("profile-payment-methods");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { id: "1", type: "visa", name: "K KAST Virtual", last4: "9138" },
    { id: "2", type: "mastercard", name: "Platinum", last4: "5678" }
  ];
}

function loadCustomSuggestions(): StoredCustomSuggestion[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SUGGESTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is StoredCustomSuggestion =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as StoredCustomSuggestion).name === "string" &&
        typeof (x as StoredCustomSuggestion).logo === "string" &&
        typeof (x as StoredCustomSuggestion).cost === "number" &&
        typeof (x as StoredCustomSuggestion).category === "string" &&
        (x as StoredCustomSuggestion).logo.length > 0,
    );
  } catch {
    return [];
  }
}

function mergeSuggestions(
  popular: typeof popularSubscriptions,
  custom: StoredCustomSuggestion[],
): SuggestionEntry[] {
  const map = new Map<string, SuggestionEntry>();
  for (const p of popular) {
    map.set(p.name.toLowerCase(), {
      name: p.name,
      cost: p.cost,
      category: p.category,
      color: p.color,
      logo: typeof p.logo === "string" ? p.logo : String(p.logo),
    });
  }
  for (const c of custom) {
    map.set(c.name.toLowerCase(), {
      name: c.name,
      cost: c.cost,
      category: c.category,
      color: c.color ?? "#6366f1",
      logo: c.logo,
    });
  }
  return Array.from(map.values());
}

const AddSubscriptionScreen = ({ onAdd, onNavigate }: Props) => {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [category, setCategory] = useState("Streaming");
  const [paymentMethods] = useState<PaymentMethod[]>(loadPaymentMethods);
  const [paymentMethod, setPaymentMethod] = useState(
    paymentMethods.length > 0 
      ? `${paymentMethods[0].name} •••• ${paymentMethods[0].last4}` 
      : "Visa •••• 1234"
  );
  const [frequency, setFrequency] = useState<"monthly" | "free_trial" | "annually">("monthly");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [selectedLogo, setSelectedLogo] = useState<string | undefined>();
  const [customLogo, setCustomLogo] = useState<string | undefined>();
  const [isCustomSub, setIsCustomSub] = useState(false);
  const [customSuggestions, setCustomSuggestions] = useState<StoredCustomSuggestion[]>(loadCustomSuggestions);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allSuggestions = useMemo(
    () => mergeSuggestions(popularSubscriptions, customSuggestions),
    [customSuggestions],
  );

  const filtered = name.length > 0
    ? allSuggestions.filter((s) => s.name.toLowerCase().includes(name.toLowerCase()))
    : [];

  const isKnownSub = allSuggestions.some((s) => s.name.toLowerCase() === name.toLowerCase());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (sub: SuggestionEntry) => {
    setName(sub.name);
    setCost(sub.cost.toString());
    setCategory(sub.category);
    setSelectedColor(sub.color);
    setSelectedLogo(sub.logo);
    setIsCustomSub(false);
    setCustomLogo(undefined);
    setShowSuggestions(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setShowSuggestions(true);
    setSelectedColor(undefined);
    setSelectedLogo(undefined);
    setIsCustomSub(true);
    setCustomLogo(undefined);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCustomLogo(reader.result as string);
      toast.success("Logo uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!name || !cost) {
      toast.error("Please fill in name and cost");
      return;
    }
    const logo = selectedLogo || customLogo;
    if (customLogo && name.trim()) {
      const entry: StoredCustomSuggestion = {
        name: name.trim(),
        logo: customLogo,
        cost: parseFloat(cost) || 0,
        category,
        color: selectedColor,
      };
      setCustomSuggestions((prev) => {
        const next = prev.filter((p) => p.name.toLowerCase() !== entry.name.toLowerCase());
        next.push(entry);
        localStorage.setItem(CUSTOM_SUGGESTIONS_KEY, JSON.stringify(next));
        return next;
      });
    }
    onAdd({
      name,
      cost: parseFloat(cost),
      renewalDate: renewalDate || new Date().toISOString().split("T")[0],
      category,
      paymentMethod,
      frequency,
      color: selectedColor,
      logo,
    });
    toast.success(`${name} added!`);
    setName("");
    setCost("");
    setRenewalDate("");
    setSelectedColor(undefined);
    setSelectedLogo(undefined);
    setCustomLogo(undefined);
    setIsCustomSub(false);
    onNavigate("summary");
  };

  const currentLogo = selectedLogo || customLogo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-6 pb-28 space-y-5"
    >
      <h1 className="text-xl font-bold text-foreground text-center">Add Subscription</h1>

      <div className="space-y-4">
        {/* Subscription Name with autocomplete */}
        <div className="relative">
          <label className="text-sm text-muted-foreground mb-1 block">Subscription Name</label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => name.length > 0 && setShowSuggestions(true)}
            placeholder="Type to search (e.g. Netflix, ChatGPT...)"
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <AnimatePresence>
            {showSuggestions && filtered.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto glass-card p-1 space-y-0.5"
              >
                {filtered.map((sub) => (
                  <button
                    key={sub.name}
                    onClick={() => handleSelectSuggestion(sub)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors text-left"
                  >
                    <img
                      src={sub.logo}
                      alt={sub.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.category}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Subscription Cost</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-muted-foreground">$</span>
            <input
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              type="number"
              placeholder="14.99"
              className="w-full bg-input border border-border rounded-xl pl-8 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Renewal Date</label>
          <input
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
            type="date"
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Logo upload for custom subscriptions */}
        {name.length > 0 && !isKnownSub && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="text-sm text-muted-foreground mb-1 block">Logo</label>
            <div className="flex items-center gap-3">
              {customLogo ? (
                <img
                  src={customLogo}
                  alt="Custom logo"
                  className="w-12 h-12 rounded-xl object-cover border border-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-input">
                  <Upload size={18} className="text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 rounded-xl border border-border bg-input text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors"
              >
                {customLogo ? "Change Logo" : "Upload Logo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </motion.div>
        )}

        {/* Preview selected logo */}
        {currentLogo && name.length > 0 && isKnownSub && (
          <div className="flex items-center gap-3 glass-card p-3">
            <img src={currentLogo} alt={name} className="w-10 h-10 rounded-lg object-cover" />
            <p className="text-sm font-medium text-foreground">{name} logo selected</p>
          </div>
        )}

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Payment Method</label>
          <div className="flex flex-wrap gap-2 pb-2">
            {paymentMethods.map((pm) => {
              const label = `${pm.name} •••• ${pm.last4}`;
              return (
              <button
                key={pm.id}
                onClick={() => setPaymentMethod(label)}
                className={`shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === label
                    ? "border-primary bg-primary/20 text-foreground"
                    : "border-border bg-input text-muted-foreground"
                }`}
              >
                {label}
              </button>
            )})}
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Frequency</label>
          <div className="flex gap-2">
            {([
              { value: "monthly", label: "Monthly" },
              { value: "annually", label: "Annually" },
              { value: "free_trial", label: "Free Trial" },
            ] as const).map((f) => (
              <button
                key={f.value}
                onClick={() => setFrequency(f.value)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  frequency === f.value
                    ? "border-primary bg-primary/20 text-foreground"
                    : "border-border bg-input text-muted-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full gradient-purple text-primary-foreground font-semibold py-3.5 rounded-xl glow-shadow transition-transform active:scale-[0.98]"
        >
          Add Subscription
        </button>
      </div>
    </motion.div>
  );
};

export default AddSubscriptionScreen;
