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

const BASE_KEY = "splitsmart_personal_v1";

function getKey(): string {
  try {
    const session = JSON.parse(
      localStorage.getItem("sb-enqezarpamdfxlfuakfh-auth-token") ||
      sessionStorage.getItem("sb-enqezarpamdfxlfuakfh-auth-token") ||
      "{}"
    );
    const uid = session?.user?.id;
    if (uid) return `${BASE_KEY}_${uid}`;
  } catch {}
  return BASE_KEY;
}

function read(): PersonalShape {
  try {
    const raw = localStorage.getItem(getKey());
    if (!raw) return { expenses: [], budgets: [], goals: [] };
    return JSON.parse(raw);
  } catch {
    return { expenses: [], budgets: [], goals: [] };
  }
}

function write(s: PersonalShape) {
  localStorage.setItem(getKey(), JSON.stringify(s));
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
    // no-op: users start with a clean slate
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
