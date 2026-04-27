export type Category =
  | "Food"
  | "Travel"
  | "Stay"
  | "Utilities"
  | "Entertainment"
  | "Shopping"
  | "Health"
  | "Other";

export const CATEGORIES: Category[] = [
  "Food", "Travel", "Stay", "Utilities", "Entertainment", "Shopping", "Health", "Other",
];

export type SplitType = "equal" | "percentage" | "exact";

export interface Member {
  id: string;
  name: string;
  color: string; // hsl string
}

export interface ExpenseSplit {
  memberId: string;
  amount: number;
  percentage?: number;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  category: Category;
  paidBy: string;
  splitType: SplitType;
  splits: ExpenseSplit[];
  notes?: string;
  date: string; // ISO
  createdAt: string;
  receiptUrl?: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  method?: string;
  settledAt: string;
}

export interface ActivityEvent {
  id: string;
  groupId: string;
  type: "expense_added" | "expense_deleted" | "settlement" | "member_added" | "group_created";
  text: string;
  at: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  color: string; // tailwind/HSL token suffix
  currency: string;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  activity: ActivityEvent[];
  createdAt: string;
  /** id of the "you" member */
  meMemberId: string;
}

export const CATEGORY_META: Record<Category, { emoji: string; color: string }> = {
  Food: { emoji: "🍕", color: "category-food" },
  Travel: { emoji: "🚗", color: "category-travel" },
  Stay: { emoji: "🏨", color: "category-stay" },
  Utilities: { emoji: "💡", color: "category-utilities" },
  Entertainment: { emoji: "🎬", color: "category-entertainment" },
  Shopping: { emoji: "🛍️", color: "category-shopping" },
  Health: { emoji: "💊", color: "category-health" },
  Other: { emoji: "💸", color: "category-other" },
};

export const GROUP_EMOJIS = ["🏖️", "🏠", "🍕", "✈️", "🎉", "🚗", "🏔️", "🏛️", "💼", "🎓", "💍", "🎂", "⛺", "🎮", "🎵", "📚", "☕", "🌮", "🏝️", "🚀"];

export const GROUP_COLORS = [
  { name: "Indigo", token: "245 100% 70%" },
  { name: "Mint", token: "168 100% 41%" },
  { name: "Sunset", token: "14 90% 60%" },
  { name: "Pink", token: "330 80% 60%" },
  { name: "Sky", token: "195 85% 50%" },
  { name: "Amber", token: "39 100% 53%" },
];

export const MEMBER_COLORS = [
  "245 100% 70%", "168 100% 41%", "14 90% 60%", "330 80% 60%",
  "195 85% 50%", "39 100% 53%", "280 70% 60%", "145 60% 45%",
];
