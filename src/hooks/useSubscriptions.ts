import { useState, useEffect } from "react";
import { Subscription, Transaction } from "@/types/subscription";

import netflixLogo from "@/assets/netflix-logo.png";
import spotifyLogo from "@/assets/spotify-logo.png";

const STORAGE_KEY = "subscriptions";

const defaultSubscriptions: Subscription[] = [];

const CURRENT_VERSION = "v5";

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const version = localStorage.getItem(STORAGE_KEY + "_version");
    if (version !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY + "_version", CURRENT_VERSION);
      return defaultSubscriptions;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultSubscriptions;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  }, [subscriptions]);


  const addSubscription = (sub: Omit<Subscription, "id">) => {
    const newSub = { ...sub, id: Date.now().toString() };
    setSubscriptions((prev) => [...prev, newSub]);
  };

  const removeSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  const clearSubscriptions = () => {
    setSubscriptions([]);
  };

  const now = new Date();
  const currentMonth = now.getMonth();

  const totalMonthly = subscriptions.reduce((sum, s) => {
    const cost = parseFloat(String(s.cost)) || 0;
    return sum + cost;
  }, 0);

  const transactions: Transaction[] = [...subscriptions]
    .reverse()
    .map((s) => ({
      id: s.id,
      subscriptionName: s.name,
      date: s.renewalDate
        ? new Date(s.renewalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      amount: s.cost,
      icon: s.icon,
      color: s.color,
      logo: s.logo,
    }));

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const currentMonthIdx = currentMonth;
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const mIdx = (currentMonthIdx - 5 + i + 12) % 12;
    const isCurrentMonth = i === 5;
    return { month: monthNames[mIdx], amount: isCurrentMonth ? totalMonthly : 0 };
  });

  return { subscriptions, addSubscription, removeSubscription, clearSubscriptions, totalMonthly, transactions, monthlyData };
}
