import { BarChart3, PlusCircle, List, User } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  active: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: "summary", label: "Summary", icon: BarChart3 },
  { id: "add", label: "Add", icon: PlusCircle },
  { id: "transactions", label: "Transactions", icon: List },
  { id: "profile", label: "Profile", icon: User },
];

const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md">
        <div className="glass-card rounded-b-none border-b-0 px-2 py-3 flex justify-around items-center">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
                  isActive ? "tab-active" : "tab-inactive"
                }`}
              >
                <tab.icon size={22} />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {isActive && (
                  <div
                    className="absolute -bottom-0 h-0.5 w-8 gradient-purple rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
