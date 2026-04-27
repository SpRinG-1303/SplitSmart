import type { Expense, Settlement, Member } from "./types";

export interface NetBalance {
  memberId: string;
  net: number; // positive = is owed, negative = owes
}

export interface DebtEdge {
  from: string;
  to: string;
  amount: number;
}

/** Compute net per-member balance across expenses + settlements. */
export function computeNetBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[],
): NetBalance[] {
  const net: Record<string, number> = {};
  members.forEach((m) => (net[m.id] = 0));

  for (const exp of expenses) {
    net[exp.paidBy] = (net[exp.paidBy] || 0) + exp.amount;
    for (const split of exp.splits) {
      net[split.memberId] = (net[split.memberId] || 0) - split.amount;
    }
  }

  for (const s of settlements) {
    // payer reduces what they owe -> increases their net
    net[s.fromMemberId] = (net[s.fromMemberId] || 0) + s.amount;
    net[s.toMemberId] = (net[s.toMemberId] || 0) - s.amount;
  }

  return members.map((m) => ({ memberId: m.id, net: round2(net[m.id] || 0) }));
}

/** Greedy debt simplifier: produces minimum-edge settlement plan. */
export function simplifyDebts(balances: NetBalance[]): DebtEdge[] {
  const debtors = balances
    .filter((b) => b.net < -0.01)
    .map((b) => ({ id: b.memberId, amt: -b.net }))
    .sort((a, b) => b.amt - a.amt);

  const creditors = balances
    .filter((b) => b.net > 0.01)
    .map((b) => ({ id: b.memberId, amt: b.net }))
    .sort((a, b) => b.amt - a.amt);

  const edges: DebtEdge[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const pay = Math.min(d.amt, c.amt);
    if (pay > 0.01) {
      edges.push({ from: d.id, to: c.id, amount: round2(pay) });
    }
    d.amt -= pay;
    c.amt -= pay;
    if (d.amt < 0.01) i++;
    if (c.amt < 0.01) j++;
  }
  return edges;
}

/** Compute splits given strategy. */
export function computeSplits(
  amount: number,
  splitType: "equal" | "percentage" | "exact",
  selectedMemberIds: string[],
  custom: Record<string, number>,
): { memberId: string; amount: number; percentage?: number }[] {
  if (splitType === "equal") {
    const per = round2(amount / selectedMemberIds.length);
    const splits = selectedMemberIds.map((id) => ({ memberId: id, amount: per }));
    // Adjust last to absorb rounding diff
    const diff = round2(amount - per * selectedMemberIds.length);
    if (splits.length) splits[splits.length - 1].amount = round2(splits[splits.length - 1].amount + diff);
    return splits;
  }
  if (splitType === "percentage") {
    return selectedMemberIds.map((id) => {
      const pct = custom[id] || 0;
      return { memberId: id, amount: round2((amount * pct) / 100), percentage: pct };
    });
  }
  return selectedMemberIds.map((id) => ({ memberId: id, amount: round2(custom[id] || 0) }));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Quick balance summary line for a member relative to others (pairwise). */
export function pairwiseBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[],
): DebtEdge[] {
  const net = computeNetBalances(members, expenses, settlements);
  return simplifyDebts(net);
}
