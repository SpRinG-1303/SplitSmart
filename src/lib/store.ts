import type { Group, Member, Expense, Settlement, ActivityEvent, Category, SplitType } from "./types";
import { MEMBER_COLORS } from "./types";

const STORAGE_KEY = "splitsmart_v1";

interface StoreShape {
  groups: Group[];
  meName: string;
}

function read(): StoreShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { groups: [], meName: "You" };
    return JSON.parse(raw);
  } catch {
    return { groups: [], meName: "You" };
  }
}

function write(s: StoreShape) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  // notify listeners
  window.dispatchEvent(new CustomEvent("splitsmart:change"));
}

export const store = {
  getAll(): Group[] {
    return read().groups;
  },
  getMeName(): string {
    return read().meName;
  },
  setMeName(name: string) {
    const s = read();
    s.meName = name;
    // also update the "me" member name in every group
    s.groups.forEach((g) => {
      const me = g.members.find((m) => m.id === g.meMemberId);
      if (me) me.name = name;
    });
    write(s);
  },
  get(id: string): Group | undefined {
    return read().groups.find((g) => g.id === id);
  },
  createGroup(input: {
    name: string;
    emoji: string;
    color: string;
    currency: string;
    memberNames: string[]; // excluding "you"
    meName: string;
  }): Group {
    const s = read();
    s.meName = input.meName;
    const meId = uid();
    const me: Member = { id: meId, name: input.meName, color: MEMBER_COLORS[0] };
    const others: Member[] = input.memberNames.map((n, i) => ({
      id: uid(),
      name: n,
      color: MEMBER_COLORS[(i + 1) % MEMBER_COLORS.length],
    }));
    const group: Group = {
      id: uid(),
      name: input.name,
      emoji: input.emoji,
      color: input.color,
      currency: input.currency,
      members: [me, ...others],
      expenses: [],
      settlements: [],
      activity: [
        {
          id: uid(),
          groupId: "",
          type: "group_created",
          text: `${input.meName} created the group`,
          at: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      meMemberId: meId,
    };
    group.activity[0].groupId = group.id;
    s.groups.unshift(group);
    write(s);
    return group;
  },
  deleteGroup(id: string) {
    const s = read();
    s.groups = s.groups.filter((g) => g.id !== id);
    write(s);
  },
  addExpense(groupId: string, exp: Omit<Expense, "id" | "groupId" | "createdAt">) {
    const s = read();
    const g = s.groups.find((x) => x.id === groupId);
    if (!g) return;
    const fullExp: Expense = {
      ...exp,
      id: uid(),
      groupId,
      createdAt: new Date().toISOString(),
    };
    g.expenses.unshift(fullExp);
    const payer = g.members.find((m) => m.id === exp.paidBy);
    g.activity.unshift({
      id: uid(),
      groupId,
      type: "expense_added",
      text: `${payer?.name ?? "Someone"} added "${exp.title}" — ${g.currency}${exp.amount.toFixed(2)}`,
      at: new Date().toISOString(),
    });
    write(s);
  },
  deleteExpense(groupId: string, expenseId: string) {
    const s = read();
    const g = s.groups.find((x) => x.id === groupId);
    if (!g) return;
    const exp = g.expenses.find((e) => e.id === expenseId);
    g.expenses = g.expenses.filter((e) => e.id !== expenseId);
    if (exp) {
      g.activity.unshift({
        id: uid(),
        groupId,
        type: "expense_deleted",
        text: `Removed "${exp.title}"`,
        at: new Date().toISOString(),
      });
    }
    write(s);
  },
  addSettlement(groupId: string, s: Omit<Settlement, "id" | "groupId" | "settledAt">) {
    const store = read();
    const g = store.groups.find((x) => x.id === groupId);
    if (!g) return;
    const settlement: Settlement = {
      ...s,
      id: uid(),
      groupId,
      settledAt: new Date().toISOString(),
    };
    g.settlements.unshift(settlement);
    const from = g.members.find((m) => m.id === s.fromMemberId);
    const to = g.members.find((m) => m.id === s.toMemberId);
    g.activity.unshift({
      id: uid(),
      groupId,
      type: "settlement",
      text: `${from?.name} paid ${to?.name} ${g.currency}${s.amount.toFixed(2)}`,
      at: new Date().toISOString(),
    });
    write(store);
  },
  addMember(groupId: string, name: string) {
    const s = read();
    const g = s.groups.find((x) => x.id === groupId);
    if (!g) return;
    const member: Member = {
      id: uid(),
      name,
      color: MEMBER_COLORS[g.members.length % MEMBER_COLORS.length],
    };
    g.members.push(member);
    g.activity.unshift({
      id: uid(),
      groupId,
      type: "member_added",
      text: `${name} joined the group`,
      at: new Date().toISOString(),
    });
    write(s);
  },
  /** Seed a demo group on first run (helps judges). */
  seedIfEmpty() {
    const s = read();
    if (s.groups.length > 0) return;
    const meId = uid();
    const aman = uid();
    const priya = uid();
    const rahul = uid();
    const demo: Group = {
      id: uid(),
      name: "Goa Trip 2025",
      emoji: "🏖️",
      color: GROUP_COLORS_TOKENS[0],
      currency: "₹",
      members: [
        { id: meId, name: "You", color: MEMBER_COLORS[0] },
        { id: aman, name: "Aman", color: MEMBER_COLORS[1] },
        { id: priya, name: "Priya", color: MEMBER_COLORS[2] },
        { id: rahul, name: "Rahul", color: MEMBER_COLORS[3] },
      ],
      expenses: [],
      settlements: [],
      activity: [{
        id: uid(), groupId: "", type: "group_created",
        text: "You created the group", at: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
      meMemberId: meId,
    };
    demo.activity[0].groupId = demo.id;

    const sample: Array<Omit<Expense, "id" | "groupId" | "createdAt">> = [
      { title: "Hotel Checkout", amount: 8400, category: "Stay", paidBy: priya, splitType: "equal",
        splits: [meId, aman, priya, rahul].map((id) => ({ memberId: id, amount: 2100 })),
        date: new Date(Date.now() - 86400000).toISOString() },
      { title: "Dinner at Smoke House", amount: 1200, category: "Food", paidBy: aman, splitType: "equal",
        splits: [meId, aman, priya, rahul].map((id) => ({ memberId: id, amount: 300 })),
        date: new Date(Date.now() - 86400000 * 2).toISOString() },
      { title: "Uber to Airport", amount: 640, category: "Travel", paidBy: meId, splitType: "equal",
        splits: [meId, aman, priya, rahul].map((id) => ({ memberId: id, amount: 160 })),
        date: new Date(Date.now() - 3600000 * 5).toISOString() },
      { title: "Beach Shack Lunch", amount: 1850, category: "Food", paidBy: rahul, splitType: "equal",
        splits: [meId, aman, priya, rahul].map((id) => ({ memberId: id, amount: 462.5 })),
        date: new Date(Date.now() - 86400000 * 3).toISOString() },
    ];
    demo.expenses = sample.map((e) => ({
      ...e, id: uid(), groupId: demo.id, createdAt: e.date,
    }));
    s.groups = [demo];
    s.meName = "You";
    write(s);
  },
};

const GROUP_COLORS_TOKENS = ["245 100% 70%", "168 100% 41%", "14 90% 60%", "330 80% 60%", "195 85% 50%", "39 100% 53%"];

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export type { Category, SplitType };
