import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Search, ArrowUpRight, Trash2 } from "lucide-react";
import { Transaction } from "@/types/subscription";
import SubscriptionLogo from "@/components/SubscriptionLogo";

const TransactionItem = ({ t, onDelete }: { t: Transaction; onDelete: (id: string) => void }) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, -50], [0, 1]);
  const scale = useTransform(x, [0, -50], [0.5, 1]);

  return (
    <div className="relative rounded-2xl bg-transparent">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-end pr-4 rounded-2xl z-0 pointer-events-none">
        <motion.button 
          style={{ opacity, scale }}
          className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground pointer-events-auto cursor-pointer border-none outline-none"
          onClick={() => onDelete(t.id)}
        >
          <Trash2 size={20} />
        </motion.button>
      </div>
      
      {/* Foreground Content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        className="glass-card px-4 py-3 flex items-center justify-between relative z-10"
      >
        <div className="flex items-center gap-3">
          <SubscriptionLogo name={t.subscriptionName} logo={t.logo} color={t.color} />
          <div>
            <p className="text-sm font-medium text-foreground">{t.subscriptionName}</p>
            <p className="text-xs text-muted-foreground">{t.date}</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-foreground">${t.amount.toFixed(2)}</p>
      </motion.div>
    </div>
  );
};

interface Props {
  transactions: Transaction[];
  totalMonthly: number;
  onDelete: (id: string) => void;
}

const TransactionsScreen = ({ transactions, totalMonthly, onDelete }: Props) => {
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
                  <TransactionItem key={t.id} t={t} onDelete={onDelete} />
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
