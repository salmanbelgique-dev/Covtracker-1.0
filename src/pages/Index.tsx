import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import SummaryScreen from "@/components/screens/SummaryScreen";
import AddSubscriptionScreen from "@/components/screens/AddSubscriptionScreen";
import TransactionsScreen from "@/components/screens/TransactionsScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { AnimatePresence } from "framer-motion";

const Index = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const { subscriptions, addSubscription, totalMonthly, transactions, monthlyData } =
    useSubscriptions();

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative overflow-hidden">
      {/* Bottom purple gradient glow */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full bg-primary/30 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-50px] left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full bg-[hsl(280_80%_50%/0.4)] blur-[80px] pointer-events-none" />
      {/* Top purple glow */}
      <div className="fixed top-[-60px] left-1/2 -translate-x-1/2 w-[350px] h-[200px] rounded-full bg-primary/20 blur-[90px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {activeTab === "summary" && (
          <SummaryScreen
            key="summary"
            totalMonthly={totalMonthly}
            transactions={transactions}
            subscriptionCount={subscriptions.length}
            monthlyData={monthlyData}
          />
        )}
        {activeTab === "add" && (
          <AddSubscriptionScreen
            key="add"
            onAdd={addSubscription}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === "transactions" && (
          <TransactionsScreen
            key="transactions"
            transactions={transactions}
            totalMonthly={totalMonthly}
          />
        )}
        {activeTab === "profile" && <ProfileScreen key="profile" />}
      </AnimatePresence>

      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
