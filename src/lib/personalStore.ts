import type { Category } from "./types";

export interface PersonalExpense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  category: Category;
  monthlyLimit: number;
}

export interface Goal {
  id: string;
  title: string;
  emoji: string;
  target: number;
  saved: number;
  deadline?: string;
  color: string;
  createdAt: string;
}

export interface PersonalShape {
  expenses: PersonalExpense[];
  budgets: Budget[];
  goals: Goal[];
}

const KEY = "splitsmart_personal_v1";

function read(): PersonalShape {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { expenses: [], budgets: [], goals: [] };
    return JSON.parse(raw);
  } catch {
    return { expenses: [], budgets: [], goals: [] };
  }
}

function write(s: PersonalShape) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("splitsmart:personal:change"));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export const personalStore = {
  get(): PersonalShape { return read(); },
  addExpense(e: Omit<PersonalExpense, "id" | "createdAt">) {
    const s = read();
    s.expenses.unshift({ ...e, id: uid(), createdAt: new Date().toISOString() });
    write(s);
  },
  deleteExpense(id: string) {
    const s = read();
    s.expenses = s.expenses.filter((e) => e.id !== id);
    write(s);
  },
  setBudget(category: Category, monthlyLimit: number) {
    const s = read();
    const idx = s.budgets.findIndex((b) => b.category === category);
    if (monthlyLimit <= 0) {
      if (idx >= 0) s.budgets.splice(idx, 1);
    } else if (idx >= 0) {
      s.budgets[idx].monthlyLimit = monthlyLimit;
    } else {
      s.budgets.push({ category, monthlyLimit });
    }
    write(s);
  },
  addGoal(g: Omit<Goal, "id" | "createdAt" | "saved"> & { saved?: number }) {
    const s = read();
    s.goals.unshift({ ...g, saved: g.saved ?? 0, id: uid(), createdAt: new Date().toISOString() });
    write(s);
  },
  contributeGoal(id: string, amount: number) {
    const s = read();
    const g = s.goals.find((x) => x.id === id);
    if (g) g.saved = Math.max(0, g.saved + amount);
    write(s);
  },
  deleteGoal(id: string) {
    const s = read();
    s.goals = s.goals.filter((g) => g.id !== id);
    write(s);
  },
  seedIfEmpty() {
    const s = read();
    if (s.expenses.length || s.budgets.length || s.goals.length) return;
    s.budgets = [
      { category: "Food", monthlyLimit: 8000 },
      { category: "Travel", monthlyLimit: 5000 },
      { category: "Entertainment", monthlyLimit: 3000 },
      { category: "Shopping", monthlyLimit: 6000 },
    ];
    s.goals = [
      { id: uid(), title: "Emergency Fund", emoji: "🛟", target: 50000, saved: 18500, color: "168 100% 41%", createdAt: new Date().toISOString() },
      { id: uid(), title: "Tokyo Trip", emoji: "🗼", target: 120000, saved: 32000, color: "330 80% 60%", createdAt: new Date().toISOString() },
      { id: uid(), title: "New Laptop", emoji: "💻", target: 90000, saved: 67000, color: "245 100% 70%", createdAt: new Date().toISOString() },
    ];
    const today = new Date();
    const mk = (d: number, title: string, amt: number, cat: Category) => ({
      id: uid(),
      title, amount: amt, category: cat,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - d).toISOString(),
      createdAt: new Date().toISOString(),
    });
    s.expenses = [
      mk(0, "Coffee", 240, "Food"),
      mk(1, "Metro card top-up", 500, "Travel"),
      mk(2, "Netflix", 649, "Entertainment"),
      mk(3, "Groceries", 2150, "Food"),
      mk(5, "Sneakers", 4200, "Shopping"),
      mk(8, "Pharmacy", 380, "Health"),
    ];
    write(s);
  },
};

import { useEffect, useState } from "react";

export function usePersonal(): PersonalShape {
  const [data, setData] = useState<PersonalShape>(() => read());
  useEffect(() => {
    const h = () => setData(read());
    window.addEventListener("splitsmart:personal:change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("splitsmart:personal:change", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return data;
}
