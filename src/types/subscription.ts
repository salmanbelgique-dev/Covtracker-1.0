export interface Subscription {
  id: string;
  name: string;
  cost: number;
  renewalDate: string;
  category: string;
  paymentMethod: string;
  frequency: "monthly" | "free_trial" | "annually";
  icon?: string;
  color?: string;
  logo?: string;
}

export interface Transaction {
  id: string;
  subscriptionName: string;
  date: string;
  amount: number;
  icon?: string;
  color?: string;
  logo?: string;
}
