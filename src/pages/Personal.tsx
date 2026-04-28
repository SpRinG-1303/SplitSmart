import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CategoryIcon } from "@/components/CategoryIcon";
import { NumberTicker } from "@/components/NumberTicker";
import { personalStore, usePersonal } from "@/lib/personalStore";
import { CATEGORIES, CATEGORY_META, type Category } from "@/lib/types";
import { Plus, Wallet, Target, TrendingDown, TrendingUp, Trash2, X, PiggyBank } from "lucide-react";
import { format, isThisMonth, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tab = "overview" | "log" | "budgets" | "goals";

export default function Personal() {
  const data = usePersonal();
  const [tab, setTab] = useState<Tab>("overview");
  const [addOpen, setAddOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  // Seed once
  if (data.expenses.length === 0 && data.budgets.length === 0 && data.goals.length === 0) {
    personalStore.seedIfEmpty();
  }

  const monthly = useMemo(() => {
    const totalsByCat: Record<Category, number> = {
      Food: 0, Travel: 0, Stay: 0, Utilities: 0, Entertainment: 0, Shopping: 0, Health: 0, Other: 0,
    };
    let total = 0;
    for (const e of data.expenses) {
      if (isThisMonth(new Date(e.date))) {
        totalsByCat[e.category] += e.amount;
        total += e.amount;
      }
    }
    return { totalsByCat, total };
  }, [data.expenses]);

  const totalBudget = data.budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSaved = data.goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = data.goals.reduce((s, g) => s + g.target, 0);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Wallet className="h-4 w-4" /> },
    { id: "log", label: "Log", icon: <TrendingDown className="h-4 w-4" /> },
    { id: "budgets", label: "Budgets", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "goals", label: "Goals", icon: <Target className="h-4 w-4" /> },
  ];

  return (
    <AppShell title="Personal">
      <main className="px-5 lg:px-8 py-6 max-w-[1600px] mx-auto pb-32">
        <div className="animate-float-up">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Personal tracker</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">Your money, mapped.</h1>
        </div>

        {/* Hero stats */}
        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          <StatCard label="Spent this month" value={monthly.total} tone="primary" />
          <StatCard label="Budget set" value={totalBudget} tone="warning" sub={totalBudget > 0 ? `${Math.round((monthly.total / totalBudget) * 100)}% used` : "No budgets yet"} />
          <StatCard label="Saved toward goals" value={totalSaved} tone="success" sub={totalTarget > 0 ? `of ₹${totalTarget.toLocaleString()}` : ""} />
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 bg-secondary/60 p-1 rounded-xl max-w-2xl">
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

        <div className="mt-5">
          {tab === "overview" && <OverviewTab monthly={monthly} budgets={data.budgets} goals={data.goals} />}
          {tab === "log" && <LogTab expenses={data.expenses} />}
          {tab === "budgets" && <BudgetsTab budgets={data.budgets} monthly={monthly} />}
          {tab === "goals" && <GoalsTab goals={data.goals} />}
        </div>
      </main>

      <button
        onClick={() => (tab === "goals" ? setGoalOpen(true) : setAddOpen(true))}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-violet text-white shadow-glow hover:scale-105 transition-transform flex items-center justify-center z-40"
        aria-label={tab === "goals" ? "Add goal" : "Add expense"}
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <AddPersonalExpenseDialog open={addOpen} onOpenChange={setAddOpen} />
      <AddGoalDialog open={goalOpen} onOpenChange={setGoalOpen} />
    </AppShell>
  );
}

function StatCard({ label, value, sub, tone }: { label: string; value: number; sub?: string; tone: "primary" | "success" | "warning" }) {
  const bg = tone === "primary" ? "bg-gradient-hero" : tone === "success" ? "bg-gradient-mint" : "bg-gradient-sunset";
  return (
    <div className={`relative rounded-2xl p-4 text-white overflow-hidden ${bg} shadow-lift`}>
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80 relative">{label}</p>
      <NumberTicker value={value} prefix="₹" decimals={0} className="font-mono-num font-bold text-2xl block mt-1 relative" />
      {sub && <p className="text-[11px] opacity-80 mt-1 relative">{sub}</p>}
    </div>
  );
}

function OverviewTab({ monthly, budgets, goals }: { monthly: { totalsByCat: Record<Category, number>; total: number }; budgets: { category: Category; monthlyLimit: number }[]; goals: { id: string; title: string; emoji: string; saved: number; target: number; color: string }[] }) {
  const sortedCats = (Object.entries(monthly.totalsByCat) as [Category, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const radius = 70;
  const C = 2 * Math.PI * radius;
  let cum = 0;
  const segs = sortedCats.map(([cat, val]) => {
    const start = cum;
    cum += val;
    return { cat, val, start };
  });

  return (
    <div className="space-y-5">
      <div className="card-surface p-6">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-4">This month · category breakdown</p>
        {monthly.total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No personal expenses this month yet.</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
                <circle cx="90" cy="90" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="22" />
                {segs.map((s, i) => {
                  const len = (s.val / monthly.total) * C;
                  const off = (s.start / monthly.total) * C;
                  return (
                    <circle key={i} cx="90" cy="90" r={radius} fill="none"
                      stroke={`hsl(var(--cat-${s.cat.toLowerCase()}))`} strokeWidth="22"
                      strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Spent</p>
                <p className="font-mono-num font-bold text-lg">₹{monthly.total.toFixed(0)}</p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 w-full">
              {sortedCats.map(([cat, val]) => (
                <div key={cat} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: `hsl(var(--cat-${cat.toLowerCase()}))` }} />
                  <span className="flex-1 truncate font-medium">{CATEGORY_META[cat].emoji} {cat}</span>
                  <span className="font-mono-num text-muted-foreground">₹{val.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {budgets.length > 0 && (
        <div className="card-surface p-5">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Budget progress</p>
          <div className="space-y-3">
            {budgets.slice(0, 4).map((b) => {
              const spent = monthly.totalsByCat[b.category] ?? 0;
              const pct = Math.min(100, (spent / b.monthlyLimit) * 100);
              const over = spent > b.monthlyLimit;
              return (
                <BudgetBar key={b.category} category={b.category} spent={spent} limit={b.monthlyLimit} pct={pct} over={over} />
              );
            })}
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Top goals</p>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {goals.slice(0, 3).map((g) => {
              const pct = Math.min(100, (g.saved / g.target) * 100);
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold">{g.emoji} {g.title}</span>
                    <span className="font-mono-num text-xs text-muted-foreground">₹{g.saved.toLocaleString()} / ₹{g.target.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, hsl(${g.color}), hsl(${g.color} / 0.7))` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetBar({ category, spent, limit, pct, over }: { category: Category; spent: number; limit: number; pct: number; over: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-semibold flex items-center gap-1.5">
          <span style={{ color: `hsl(var(--cat-${category.toLowerCase()}))` }}>{CATEGORY_META[category].emoji}</span>
          {category}
        </span>
        <span className={cn("font-mono-num text-xs", over ? "text-destructive font-bold" : "text-muted-foreground")}>
          ₹{spent.toFixed(0)} / ₹{limit.toFixed(0)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", over ? "bg-destructive" : "")}
          style={{
            width: `${pct}%`,
            background: over ? undefined : `hsl(var(--cat-${category.toLowerCase()}))`,
          }}
        />
      </div>
    </div>
  );
}

function LogTab({ expenses }: { expenses: { id: string; title: string; amount: number; category: Category; date: string }[] }) {
  if (expenses.length === 0) {
    return (
      <div className="card-surface p-10 text-center">
        <p className="text-muted-foreground text-sm">Add your first personal expense.</p>
      </div>
    );
  }
  const byDate: Record<string, typeof expenses> = {};
  for (const e of expenses) {
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
            {items.map((e) => (
              <div key={e.id} className="card-surface card-lift p-3.5 flex items-center gap-3 group">
                <CategoryIcon category={e.category} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.category}</p>
                </div>
                <p className="font-mono-num font-bold">₹{e.amount.toFixed(2)}</p>
                <button onClick={() => { personalStore.deleteExpense(e.id); toast.success("Removed"); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetsTab({ budgets, monthly }: { budgets: { category: Category; monthlyLimit: number }[]; monthly: { totalsByCat: Record<Category, number> } }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground px-1">Tap a category to set or update its monthly budget.</p>
      <div className="card-surface divide-y divide-border">
        {CATEGORIES.map((cat) => {
          const b = budgets.find((x) => x.category === cat);
          const spent = monthly.totalsByCat[cat] ?? 0;
          return (
            <div key={cat} className="p-4 flex items-center gap-3">
              <CategoryIcon category={cat} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{cat}</p>
                <p className="text-xs text-muted-foreground font-mono-num">
                  Spent ₹{spent.toFixed(0)}{b ? ` of ₹${b.monthlyLimit.toFixed(0)}` : ""}
                </p>
              </div>
              <BudgetInput category={cat} current={b?.monthlyLimit ?? 0} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BudgetInput({ category, current }: { category: Category; current: number }) {
  const [val, setVal] = useState(current ? String(current) : "");
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">₹</span>
      <Input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          const n = parseFloat(val) || 0;
          if (n !== current) {
            personalStore.setBudget(category, n);
            toast.success(n > 0 ? `Budget set for ${category}` : `Budget cleared`);
          }
        }}
        placeholder="0"
        className="h-8 w-24 text-right font-mono-num text-sm"
      />
    </div>
  );
}

function GoalsTab({ goals }: { goals: { id: string; title: string; emoji: string; saved: number; target: number; color: string; deadline?: string }[] }) {
  if (goals.length === 0) {
    return (
      <div className="card-surface p-10 text-center">
        <Target className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <p className="font-semibold">No savings goals yet</p>
        <p className="text-muted-foreground text-sm mt-1">Tap + to create your first.</p>
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {goals.map((g) => {
        const pct = Math.min(100, (g.saved / g.target) * 100);
        const left = Math.max(0, g.target - g.saved);
        return (
          <div key={g.id} className="card-surface p-5 group">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `hsl(${g.color} / 0.15)` }}>
                {g.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{g.title}</p>
                <p className="text-xs text-muted-foreground font-mono-num">₹{left.toLocaleString()} to go</p>
              </div>
              <button onClick={() => { if (confirm(`Delete "${g.title}"?`)) personalStore.deleteGoal(g.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono-num font-semibold">₹{g.saved.toLocaleString()}</span>
                <span className="text-muted-foreground font-mono-num">₹{g.target.toLocaleString()}</span>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, hsl(${g.color}), hsl(${g.color} / 0.6))` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-mono-num">{pct.toFixed(0)}% complete</p>
            </div>
            <div className="mt-4 flex gap-2">
              <ContributeButton id={g.id} amount={500} />
              <ContributeButton id={g.id} amount={1000} />
              <ContributeButton id={g.id} amount={5000} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContributeButton({ id, amount }: { id: string; amount: number }) {
  return (
    <button
      onClick={() => { personalStore.contributeGoal(id, amount); toast.success(`+₹${amount} saved`); }}
      className="flex-1 px-2 py-1.5 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary text-xs font-semibold transition-colors font-mono-num"
    >
      +₹{amount}
    </button>
  );
}

function AddPersonalExpenseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");

  const submit = () => {
    const amt = parseFloat(amount);
    if (!title.trim() || !amt || amt <= 0) { toast.error("Add a title and amount"); return; }
    personalStore.addExpense({
      title: title.trim(),
      amount: amt,
      category,
      date: new Date().toISOString(),
    });
    toast.success("Added");
    setTitle(""); setAmount(""); setCategory("Food");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">Add personal expense</h2>
          <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Coffee, Uber, Groceries" className="mt-1.5" autoFocus />
          </div>
          <div>
            <Label>Amount (₹)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1.5 font-mono-num" />
          </div>
          <div>
            <Label>Category</Label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={cn(
                    "p-2 rounded-xl border text-xs font-semibold transition-all",
                    category === c ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  )}>
                  <div className="text-base mb-0.5">{CATEGORY_META[c].emoji}</div>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={submit} className="w-full bg-gradient-hero hover:opacity-90 text-white font-semibold rounded-xl">
            Add expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const GOAL_COLORS = ["245 100% 70%", "168 100% 41%", "14 90% 60%", "330 80% 60%", "195 85% 50%", "39 100% 53%"];
const GOAL_EMOJIS = ["🎯", "🛟", "✈️", "🏠", "🚗", "💍", "🎓", "💻", "📱", "🎮", "🗼", "🏖️"];

function AddGoalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [color, setColor] = useState(GOAL_COLORS[0]);

  const submit = () => {
    const t = parseFloat(target);
    if (!title.trim() || !t || t <= 0) { toast.error("Add a title and target"); return; }
    personalStore.addGoal({ title: title.trim(), target: t, emoji, color });
    toast.success("Goal created 🎯");
    setTitle(""); setTarget(""); setEmoji("🎯"); setColor(GOAL_COLORS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">New savings goal</h2>
          <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tokyo Trip" className="mt-1.5" autoFocus />
          </div>
          <div>
            <Label>Target amount (₹)</Label>
            <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="100000" className="mt-1.5 font-mono-num" />
          </div>
          <div>
            <Label>Emoji</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {GOAL_EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={cn("h-9 w-9 rounded-lg text-lg transition-all", emoji === e ? "bg-primary/15 ring-2 ring-primary" : "bg-secondary hover:bg-secondary/80")}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-1.5 flex gap-2">
              {GOAL_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn("h-8 w-8 rounded-lg transition-all", color === c ? "ring-2 ring-offset-2 ring-offset-background" : "")}
                  style={{ backgroundColor: `hsl(${c})`, boxShadow: color === c ? `0 0 0 2px hsl(${c})` : undefined }}
                />
              ))}
            </div>
          </div>
          <Button onClick={submit} className="w-full bg-gradient-hero hover:opacity-90 text-white font-semibold rounded-xl">
            Create goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
