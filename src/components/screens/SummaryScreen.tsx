import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Transaction } from "@/types/subscription";
import SubscriptionLogo from "@/components/SubscriptionLogo";
import appLogo from "@/assets/logo.png";

const PROFILE_DISPLAY_NAME_KEY = "profile-display-name";
const PROFILE_PHOTO_KEY = "profile-photo-data";
const DEFAULT_GREETING_NAME = "Covitch";

interface Props {
  totalMonthly: number;
  transactions: Transaction[];
  subscriptionCount: number;
  monthlyData: { month: string; amount: number }[];
}

const SummaryScreen = ({ totalMonthly, transactions, subscriptionCount, monthlyData }: Props) => {
  const [greetingName, setGreetingName] = useState(
    () => localStorage.getItem(PROFILE_DISPLAY_NAME_KEY) ?? DEFAULT_GREETING_NAME,
  );
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(
    () => localStorage.getItem(PROFILE_PHOTO_KEY)
  );

  useEffect(() => {
    const syncProfile = () => {
      setGreetingName(localStorage.getItem(PROFILE_DISPLAY_NAME_KEY) ?? DEFAULT_GREETING_NAME);
      setProfilePhotoUrl(localStorage.getItem(PROFILE_PHOTO_KEY));
    };
    window.addEventListener("app-profile-updated", syncProfile);
    return () => window.removeEventListener("app-profile-updated", syncProfile);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-6 pb-28 space-y-6"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 glow-shadow">
            <img
              src={profilePhotoUrl ?? appLogo}
              alt={greetingName}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-semibold text-foreground">{greetingName}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mt-1">Welcome back 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your subscription spending overview
        </p>
      </div>

      <div className="gradient-purple rounded-2xl p-5 glow-shadow">
        <p className="text-primary-foreground/70 text-sm font-medium">Total Spent This Month</p>
        <p className="text-4xl font-extrabold text-primary-foreground mt-1">
          ${totalMonthly.toFixed(2)}
        </p>
        <p className="text-primary-foreground/50 text-xs mt-2">
          {subscriptionCount} active subscriptions
        </p>
      </div>

      <div className="glass-card p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-foreground">Spending Statistics</h2>
          <span className="text-xs text-muted-foreground">Last 6 months</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(270 70% 55%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(270 70% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(270 10% 55%)", fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "hsl(270 25% 14%)",
                border: "1px solid hsl(270 30% 25%)",
                borderRadius: 12,
                color: "white",
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Spent"]}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(270 70% 55%)"
              strokeWidth={2}
              fill="url(#purpleGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="font-semibold text-foreground mb-3">Recent Transactions</h2>
        <div className="space-y-6">
          {(() => {
            const grouped: { title: string; items: Transaction[] }[] = [];
            let currentKey = "";
            let currentGroup: Transaction[] = [];
            
            transactions.slice(0, 5).forEach(t => {
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
      </div>
    </motion.div>
  );
};

export default SummaryScreen;
