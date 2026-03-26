import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpRight } from "lucide-react";
import { Transaction } from "@/types/subscription";
import SubscriptionLogo from "@/components/SubscriptionLogo";

interface Props {
  transactions: Transaction[];
  totalMonthly: number;
}

const TransactionsScreen = ({ transactions, totalMonthly }: Props) => {
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) =>
    t.subscriptionName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-6 pb-28 space-y-5"
    >
      <h1 className="text-xl font-bold text-foreground text-center">All Transactions</h1>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl p-[1px] glow-shadow">
        {/* Animated rotating border */}
        <div className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2">
          <div 
            className="w-full h-full animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_50%,hsl(var(--primary))_100%)]"
          />
        </div>
        
        {/* Inner Content */}
        <div className="relative bg-background w-full h-full rounded-[15px] p-4 flex justify-between items-center z-10">
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses This Month</p>
            <p className="text-2xl font-bold text-foreground">${totalMonthly.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center">
            <ArrowUpRight size={18} className="text-primary-foreground" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {(() => {
          const grouped: { title: string; items: Transaction[] }[] = [];
          let currentKey = "";
          let currentGroup: Transaction[] = [];
          
          filtered.forEach(t => {
            const parts = t.date.split(" ");
            const key = `${parts[0]} ${parts[2] || ""}`.trim();
            if (key !== currentKey) {
              if (currentGroup.length > 0) grouped.push({ title: currentKey, items: currentGroup });
              currentKey = key;
              currentGroup = [t];
            } else {
              currentGroup.push(t);
            }
          });
          if (currentGroup.length > 0) grouped.push({ title: currentKey, items: currentGroup });
          
          return grouped.map(group => (
            <div key={group.title} className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase pl-1">{group.title}</h3>
              <div className="space-y-2">
                {group.items.map((t) => (
                  <div
                    key={t.id}
                    className="glass-card px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <SubscriptionLogo name={t.subscriptionName} logo={t.logo} color={t.color} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.subscriptionName}</p>
                        <p className="text-xs text-muted-foreground">{t.date}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">${t.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>
    </motion.div>
  );
};

export default TransactionsScreen;
