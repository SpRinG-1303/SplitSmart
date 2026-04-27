import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGroup } from "@/lib/useGroups";
import { computeNetBalances, simplifyDebts, rawPairwiseDebts } from "@/lib/balance";
import { CATEGORY_META, type Category } from "@/lib/types";
import { MemberAvatar, MemberStack } from "@/components/MemberAvatar";
import { CategoryIcon } from "@/components/CategoryIcon";
import { NumberTicker } from "@/components/NumberTicker";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { SettleUpDialog } from "@/components/SettleUpDialog";
import { generateInsights } from "@/lib/smartParser";
import { ArrowLeft, Plus, Sparkles, Trash2, Receipt as ReceiptIcon, Wallet, BarChart3, Activity } from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { store } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tab = "expenses" | "balances" | "insights" | "activity";

export default function GroupDashboard() {
  const { id } = useParams<{ id: string }>();
  const group = useGroup(id);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("expenses");
  const [addOpen, setAddOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Group not found.</p>
          <Button onClick={() => navigate("/app")} variant="outline">Back home</Button>
        </div>
      </div>
    );
  }

  const balances = computeNetBalances(group.members, group.expenses, group.settlements);
  const myNet = balances.find((b) => b.memberId === group.meMemberId)?.net ?? 0;
  const total = group.expenses.reduce((s, e) => s + e.amount, 0);
  const edges = simplifyDebts(balances);
  const memberById = (mid: string) => group.members.find((m) => m.id === mid);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "expenses", label: "Expenses", icon: <ReceiptIcon className="h-4 w-4" /> },
    { id: "balances", label: "Balances", icon: <Wallet className="h-4 w-4" /> },
    { id: "insights", label: "Insights", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "activity", label: "Activity", icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top nav */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/75 border-b border-border">
        <div className="container max-w-3xl flex items-center justify-between h-16">
          <Link to="/app" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center -ml-1">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="text-xl">{group.emoji}</span>
            <span className="font-bold truncate max-w-[180px]">{group.name}</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => {
            if (confirm(`Delete ${group.name}? This can't be undone.`)) {
              store.deleteGroup(group.id);
              toast.success("Group deleted");
              navigate("/app");
            }
          }} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl pt-6">
        {/* Hero card */}
        <div
          className="rounded-3xl p-6 text-white relative overflow-hidden animate-float-up"
          style={{
            background: `linear-gradient(135deg, hsl(${group.color}) 0%, hsl(${group.color} / 0.8) 100%)`,
          }}
        >
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Total spend</p>
                <NumberTicker value={total} prefix={group.currency} decimals={2}
                  className="font-mono-num font-bold text-3xl block mt-1" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">
                  {Math.abs(myNet) < 0.01 ? "Settled" : myNet > 0 ? "You're owed" : "You owe"}
                </p>
                <NumberTicker value={Math.abs(myNet)} prefix={group.currency} decimals={2}
                  className="font-mono-num font-bold text-2xl block mt-1" />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <MemberStack members={group.members} max={5} />
              <Button onClick={() => setSettleOpen(true)}
                className="bg-white/15 backdrop-blur hover:bg-white/25 text-white border-0 rounded-xl gap-1.5 font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Settle up
              </Button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mt-6 flex gap-1 bg-secondary/60 p-1 rounded-xl">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                tab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-5">
          {tab === "expenses" && <ExpensesTab group={group} />}
          {tab === "balances" && <BalancesTab group={group} edges={edges} memberById={memberById} onSettle={() => setSettleOpen(true)} />}
          {tab === "insights" && <InsightsTab group={group} />}
          {tab === "activity" && <ActivityTab group={group} />}
        </div>
      </main>

      {/* FAB */}
      <button onClick={() => setAddOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-hero text-white shadow-lift hover:scale-105 transition-transform flex items-center justify-center z-40 shadow-glow">
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <AddExpenseDialog open={addOpen} onOpenChange={setAddOpen} group={group} />
      <SettleUpDialog open={settleOpen} onOpenChange={setSettleOpen} group={group} />
    </div>
  );
}

function ExpensesTab({ group }: { group: ReturnType<typeof useGroup> & {} }) {
  if (group.expenses.length === 0) {
    return (
      <div className="card-surface p-10 text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-card flex items-center justify-center text-3xl mb-3">📜</div>
        <p className="font-bold">No expenses yet</p>
        <p className="text-muted-foreground text-sm mt-1">Tap the + button to add the first one.</p>
      </div>
    );
  }

  // Group by date label
  const byDate: Record<string, typeof group.expenses> = {};
  for (const e of group.expenses) {
    const d = new Date(e.date);
    const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMM d");
    (byDate[label] ||= []).push(e);
  }

  return (
    <div className="space-y-5">
      {Object.entries(byDate).map(([label, items]) => (
        <div key={label}>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">{label}</p>
          <div className="space-y-2">
            {items.map((e, i) => {
              const payer = group.members.find((m) => m.id === e.paidBy);
              const myShare = e.splits.find((s) => s.memberId === group.meMemberId)?.amount ?? 0;
              return (
                <div key={e.id}
                  className="card-surface card-lift p-3.5 flex items-center gap-3 group animate-float-up"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <CategoryIcon category={e.category} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {payer?.id === group.meMemberId ? "You" : payer?.name} paid · split {e.splits.length} ways
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-num font-bold">{group.currency}{e.amount.toFixed(2)}</p>
                    {myShare > 0 && (
                      <p className="text-[10px] text-muted-foreground font-mono-num">
                        Your share {group.currency}{myShare.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${e.title}"?`)) {
                        store.deleteExpense(group.id, e.id);
                        toast.success("Expense removed");
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function BalancesTab({
  group, edges, memberById, onSettle,
}: {
  group: ReturnType<typeof useGroup> & {};
  edges: { from: string; to: string; amount: number }[];
  memberById: (id: string) => any;
  onSettle: () => void;
}) {
  const balances = computeNetBalances(group.members, group.expenses, group.settlements);
  const raw = rawPairwiseDebts(group.members, group.expenses, group.settlements);
  const [view, setView] = useState<"simplified" | "raw">("simplified");

  if (edges.length === 0) {
    return (
      <div className="card-surface p-10 text-center">
        <div className="h-16 w-16 mx-auto rounded-full bg-success/10 text-success flex items-center justify-center text-2xl mb-3">✓</div>
        <p className="font-bold">All settled!</p>
        <p className="text-muted-foreground text-sm mt-1">Nothing owed in this group.</p>
      </div>
    );
  }

  const saved = Math.max(0, raw.length - edges.length);
  const list = view === "simplified" ? edges : raw;

  return (
    <div className="space-y-4">
      {/* Before/After magic banner */}
      {saved > 0 && (
        <div className="rounded-2xl p-4 bg-gradient-hero text-white shadow-lift relative overflow-hidden animate-pop-in">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <Sparkles className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-bold text-sm">Simplified {raw.length} debts → {edges.length} payments</p>
              <p className="text-xs opacity-90 mt-0.5">Saved everyone {saved} {saved === 1 ? "transaction" : "transactions"}.</p>
            </div>
            <Button size="sm" onClick={onSettle} className="bg-white/20 hover:bg-white/30 backdrop-blur text-white border-0 rounded-lg font-semibold">
              Settle
            </Button>
          </div>
          <div className="relative mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white/10 rounded-lg px-2.5 py-1.5">
              <p className="opacity-70 uppercase tracking-wider font-semibold">Before</p>
              <p className="font-mono-num font-bold text-lg">{raw.length}</p>
            </div>
            <div className="bg-white/20 rounded-lg px-2.5 py-1.5">
              <p className="opacity-90 uppercase tracking-wider font-semibold">After</p>
              <p className="font-mono-num font-bold text-lg">{edges.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="flex gap-1 bg-secondary/60 p-1 rounded-xl">
        <button onClick={() => setView("simplified")}
          className={cn("flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            view === "simplified" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
          ✨ Simplified ({edges.length})
        </button>
        <button onClick={() => setView("raw")}
          className={cn("flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            view === "raw" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
          🧾 Raw debts ({raw.length})
        </button>
      </div>

      <div className="space-y-2">
        {list.map((e, i) => {
          const from = memberById(e.from);
          const to = memberById(e.to);
          if (!from || !to) return null;
          return (
            <div key={`${view}-${i}`} className="card-surface p-4 flex items-center gap-3 animate-float-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <MemberAvatar member={from} size="md" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{from.id === group.meMemberId ? "You" : from.name}</span>
                  <span className="text-muted-foreground"> {from.id === group.meMemberId ? "pay" : "pays"} </span>
                  <span className="font-semibold">{to.id === group.meMemberId ? "you" : to.name}</span>
                </p>
              </div>
              <span className="font-mono-num font-bold">{group.currency}{e.amount.toFixed(2)}</span>
              <MemberAvatar member={to} size="md" />
            </div>
          );
        })}
      </div>

      {/* Per-member net */}
      <div className="mt-6">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Net per member</p>
        <div className="card-surface divide-y divide-border">
          {balances.map((b) => {
            const m = memberById(b.memberId);
            if (!m) return null;
            const tone = Math.abs(b.net) < 0.01 ? "muted" : b.net > 0 ? "success" : "danger";
            return (
              <div key={b.memberId} className="flex items-center gap-3 p-3.5">
                <MemberAvatar member={m} size="sm" />
                <span className="flex-1 text-sm font-medium">{m.id === group.meMemberId ? "You" : m.name}</span>
                <span className={cn("font-mono-num font-bold text-sm",
                  tone === "success" && "text-success",
                  tone === "danger" && "text-destructive",
                  tone === "muted" && "text-muted-foreground"
                )}>
                  {tone === "muted" ? "settled" : `${b.net > 0 ? "+" : ""}${group.currency}${b.net.toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InsightsTab({ group }: { group: ReturnType<typeof useGroup> & {} }) {
  const data = useMemo(() => {
    const totalsByCategory: Record<Category, number> = {
      Food: 0, Travel: 0, Stay: 0, Utilities: 0, Entertainment: 0, Shopping: 0, Health: 0, Other: 0,
    };
    let total = 0;
    const byMember: Record<string, number> = {};
    group.members.forEach((m) => (byMember[m.id] = 0));
    for (const e of group.expenses) {
      totalsByCategory[e.category] += e.amount;
      total += e.amount;
      byMember[e.paidBy] = (byMember[e.paidBy] || 0) + e.amount;
    }
    const balances = computeNetBalances(group.members, group.expenses, group.settlements);
    const edges = simplifyDebts(balances);
    const topPayerEntry = Object.entries(byMember).sort((a, b) => b[1] - a[1])[0];
    const topPayerMember = topPayerEntry ? group.members.find((m) => m.id === topPayerEntry[0]) : undefined;

    const insights = generateInsights({
      totalsByCategory,
      total,
      memberCount: group.members.length,
      expenseCount: group.expenses.length,
      currency: group.currency,
      groupName: group.name,
      meName: group.members.find((m) => m.id === group.meMemberId)?.name ?? "You",
      topPayer: topPayerMember && topPayerEntry[1] > 0
        ? { name: topPayerMember.id === group.meMemberId ? "You" : topPayerMember.name, amount: topPayerEntry[1] }
        : undefined,
      simplifiedEdges: edges.map((e) => ({
        from: e.from, to: e.to, amount: e.amount,
        fromName: group.members.find((m) => m.id === e.from)?.name ?? "?",
        toName: group.members.find((m) => m.id === e.to)?.name ?? "?",
      })),
    });
    return { totalsByCategory, total, byMember, insights };
  }, [group]);

  if (group.expenses.length === 0) {
    return (
      <div className="card-surface p-10 text-center">
        <p className="text-muted-foreground text-sm">Add a few expenses to see insights here.</p>
      </div>
    );
  }

  const sortedCats = (Object.entries(data.totalsByCategory) as [Category, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  // Donut chart math
  let cumulative = 0;
  const segments = sortedCats.map(([cat, val]) => {
    const start = cumulative;
    cumulative += val;
    return { cat, val, start, end: cumulative };
  });
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  const maxMemberSpend = Math.max(...Object.values(data.byMember), 1);

  return (
    <div className="space-y-5">
      {/* Donut */}
      <div className="card-surface p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
              <circle cx="90" cy="90" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="22" />
              {segments.map((s, i) => {
                const len = (s.val / data.total) * circumference;
                const off = (s.start / data.total) * circumference;
                return (
                  <circle key={i} cx="90" cy="90" r={radius} fill="none"
                    stroke={`hsl(var(--cat-${s.cat.toLowerCase()}))`}
                    strokeWidth="22"
                    strokeDasharray={`${len} ${circumference - len}`}
                    strokeDashoffset={-off}
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
              <p className="font-mono-num font-bold text-lg">{group.currency}{data.total.toFixed(0)}</p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 w-full">
            {sortedCats.map(([cat, val]) => (
              <div key={cat} className="flex items-center gap-2 text-xs">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: `hsl(var(--cat-${cat.toLowerCase()}))` }} />
                <span className="flex-1 truncate font-medium">{CATEGORY_META[cat].emoji} {cat}</span>
                <span className="font-mono-num text-muted-foreground">{Math.round((val / data.total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI insight cards */}
      {data.insights.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" /> Smart insights
          </p>
          <div className="space-y-2">
            {data.insights.map((text, i) => (
              <div key={i}
                className="rounded-2xl p-4 bg-gradient-card border border-primary/15 animate-float-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <p className="text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-member */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Who paid what</p>
        <div className="card-surface p-4 space-y-3">
          {group.members.map((m) => {
            const v = data.byMember[m.id] || 0;
            const pct = Math.max(2, (v / maxMemberSpend) * 100);
            return (
              <div key={m.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MemberAvatar member={m} size="xs" />
                    <span className="text-xs font-medium">{m.id === group.meMemberId ? "You" : m.name}</span>
                  </div>
                  <span className="font-mono-num text-xs font-semibold">{group.currency}{v.toFixed(0)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: `hsl(${m.color})` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ group }: { group: ReturnType<typeof useGroup> & {} }) {
  if (group.activity.length === 0) {
    return (
      <div className="card-surface p-10 text-center">
        <p className="text-muted-foreground text-sm">No activity yet.</p>
      </div>
    );
  }
  const ICONS: Record<string, string> = {
    expense_added: "💸", expense_deleted: "🗑️", settlement: "✓", member_added: "👋", group_created: "🎉",
  };
  return (
    <div className="space-y-2">
      {group.activity.map((a, i) => (
        <div key={a.id} className="card-surface p-3.5 flex items-center gap-3 animate-float-up" style={{ animationDelay: `${i * 0.03}s` }}>
          <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center text-base shrink-0">
            {ICONS[a.type] ?? "·"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{a.text}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(a.at), { addSuffix: true })}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
