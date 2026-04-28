import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/lib/useGroups";
import { usePersonal } from "@/lib/personalStore";
import { computeNetBalances, simplifyDebts } from "@/lib/balance";
import { MemberAvatar } from "@/components/MemberAvatar";
import { CategoryIcon } from "@/components/CategoryIcon";
import { NumberTicker } from "@/components/NumberTicker";
import { Sparkline } from "@/components/Sparkline";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { SettleUpDialog } from "@/components/SettleUpDialog";
import { generateInsights } from "@/lib/smartParser";
import { store } from "@/lib/store";
import { type Category, type Group } from "@/lib/types";
import {
  Calendar, Download, Plus,
  Sparkles, TrendingUp, Send, ChevronRight, Lightbulb,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday, startOfMonth, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function Home() {
  const groups = useGroups();
  const personal = usePersonal();
  const navigate = useNavigate();
  const meName = store.getMeName();
  const [createOpen, setCreateOpen] = useState(false);
  const [settleGroup, setSettleGroup] = useState<Group | null>(null);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => computeStats(groups), [groups]);

  const greeting = (() => {
    const h = clock.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const timeStr = clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <AppShell title="Dashboard">
      <div className="px-5 lg:px-8 py-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 animate-float-up">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              {greeting}, {meName}!
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Here's your expense overview</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="card-surface px-3.5 py-2 flex items-center gap-2">
              <span className="font-mono-num font-bold text-sm tabular-nums">{timeStr}</span>
            </div>
            <button className="card-surface px-3.5 py-2 flex items-center gap-2 text-sm hover:bg-secondary/50 transition-colors">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold">{format(startOfMonth(new Date()), "MMM d")} – {format(new Date(), "MMM d, yyyy")}</span>
            </button>
            <button className="card-surface h-9 w-9 flex items-center justify-center hover:bg-secondary/50 transition-colors">
              <Download className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Top row: 3 stat cards + AI insight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
          <StatCard
            className="lg:col-span-3"
            label="Spent This Month"
            value={stats.spentMonth}
            sparklineData={stats.monthSpark}
            gradient="violet"
            delay={0}
          />
          <StatCard
            className="lg:col-span-3"
            label="You Owe"
            value={stats.totalOwing}
            sparklineData={stats.owingSpark}
            gradient="coral"
            delay={0.05}
          />
          <StatCard
            className="lg:col-span-3"
            label="You're Owed"
            value={stats.totalOwed}
            sparklineData={stats.owedSpark}
            gradient="mint"
            delay={0.1}
          />
          <AIInsightCard
            className="lg:col-span-3"
            insight={stats.topInsight}
            delay={0.15}
          />
        </div>

        {/* Second row: Donut + Recent Activity + Balances */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          <SpendingBreakdown className="lg:col-span-5" stats={stats} delay={0.2} />
          <RecentActivity
            className="lg:col-span-4"
            groups={groups}
            delay={0.25}
          />
          <BalancesPanel
            className="lg:col-span-3"
            stats={stats}
            onSettle={(g) => setSettleGroup(g)}
            delay={0.3}
          />
        </div>

        {/* Third row: Budget progress + Who owes whom + AI assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          <BudgetProgressCard className="lg:col-span-4" delay={0.35} personal={personal} />
          <WhoOwesWhom className="lg:col-span-4" stats={stats} delay={0.4} />
          <AIAssistantCard className="lg:col-span-4" delay={0.45} stats={stats} groups={groups} />
        </div>

        {/* Tip footer */}
        <div className="mt-4 card-surface p-3.5 flex items-center justify-between gap-3 animate-float-up" style={{ animationDelay: "0.5s" }}>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-warning/15 text-warning flex items-center justify-center shrink-0">
              <Lightbulb className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm">
              <span className="font-semibold">Tip:</span>{" "}
              <span className="text-muted-foreground">Set up budgets to track your spending better!</span>
            </p>
          </div>
          <Link to="/personal?tab=budgets" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 shrink-0">
            Manage Budgets <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {groups.length === 0 && (
          <div className="mt-6 card-surface p-10 text-center animate-float-up">
            <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-card flex items-center justify-center text-4xl mb-4">💸</div>
            <h3 className="font-bold text-lg">No groups yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-5">Create your first group to start splitting.</p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-violet hover:opacity-90 text-white font-semibold rounded-xl gap-1.5 shadow-glow"
            >
              <Sparkles className="h-4 w-4" /> Create your first group
            </Button>
          </div>
        )}
      </div>

      {/* Floating + */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-violet text-white shadow-glow hover:scale-105 transition-transform flex items-center justify-center z-30"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(g) => navigate(`/group/${g.id}`)} />
      {settleGroup && (
        <SettleUpDialog open={!!settleGroup} onOpenChange={(o) => !o && setSettleGroup(null)} group={settleGroup} />
      )}
    </AppShell>
  );
}

/* ================================================================ */
/* Cards                                                             */
/* ================================================================ */

function StatCard({
  className, label, value, sparklineData, gradient, delay,
}: {
  className?: string;
  label: string;
  value: number;
  sparklineData: number[];
  gradient: "violet" | "coral" | "mint";
  delay: number;
}) {
  const grads = {
    violet: { stroke: "hsl(258 100% 75%)", glow: "shadow-glow", bar: "bg-primary/15 text-primary" },
    coral:  { stroke: "hsl(354 90% 68%)",  glow: "shadow-glow-coral", bar: "bg-destructive/15 text-destructive" },
    mint:   { stroke: "hsl(158 80% 55%)",  glow: "shadow-glow-mint", bar: "bg-success/15 text-success" },
  } as const;
  const g = grads[gradient];

  return (
    <div
      className={cn("card-surface p-5 relative overflow-hidden card-lift animate-float-up", className)}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${g.stroke}, transparent 70%)` }} />
      <div className="relative">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <NumberTicker
          value={value}
          prefix="₹"
          decimals={0}
          className="font-mono-num font-extrabold text-3xl block mt-1.5"
        />
        <div className="mt-3 flex items-center justify-end">
          <Sparkline
            data={sparklineData}
            width={70}
            height={28}
            stroke={g.stroke}
            fill={g.stroke}
            strokeWidth={1.75}
          />
        </div>
      </div>
    </div>
  );
}

function AIInsightCard({ className, insight, delay }: { className?: string; insight: string; delay: number }) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 relative overflow-hidden card-lift animate-float-up bg-gradient-violet text-white border border-primary/30 shadow-glow",
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="relative">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-90">
          <Sparkles className="h-3.5 w-3.5" /> AI Insight
        </div>
        <p className="mt-3 text-sm leading-relaxed font-medium">{insight}</p>
        <button className="mt-4 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all opacity-95">
          View all insights <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function SpendingBreakdown({ className, stats, delay }: { className?: string; stats: ReturnType<typeof computeStats>; delay: number }) {
  const { catTotals, total } = stats;
  const sorted = (Object.entries(catTotals) as [Category, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
  let cumulative = 0;
  const radius = 65;
  const C = 2 * Math.PI * radius;
  const segments = sorted.map(([cat, val]) => {
    const start = cumulative;
    cumulative += val;
    return { cat, val, start };
  });

  return (
    <div className={cn("card-surface p-5 card-lift animate-float-up", className)} style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Spending Breakdown</h3>
        <button className="text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
          This Month <ChevronRight className="h-3 w-3 rotate-90" />
        </button>
      </div>
      {total === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Add expenses to see your breakdown</div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <svg width="170" height="170" viewBox="0 0 170 170" className="-rotate-90">
              <circle cx="85" cy="85" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="20" />
              {segments.map((s, i) => {
                const len = (s.val / total) * C;
                const off = (s.start / total) * C;
                return (
                  <circle key={i} cx="85" cy="85" r={radius} fill="none"
                    stroke={`hsl(var(--cat-${s.cat.toLowerCase()}))`}
                    strokeWidth="20"
                    strokeDasharray={`${len} ${C - len}`}
                    strokeDashoffset={-off}
                    strokeLinecap="butt"
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Spent</p>
              <p className="font-mono-num font-extrabold text-xl mt-0.5">₹{total.toFixed(0)}</p>
            </div>
          </div>
          <div className="flex-1 w-full space-y-2">
            {sorted.map(([cat, val]) => {
              const pct = Math.round((val / total) * 100);
              return (
                <div key={cat} className="flex items-center gap-2.5 text-sm">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: `hsl(var(--cat-${cat.toLowerCase()}))` }} />
                  <span className="flex-1 font-medium">{cat}</span>
                  <span className="font-mono-num text-muted-foreground text-xs">₹{val.toFixed(0)}</span>
                  <span className="font-mono-num font-bold text-xs w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RecentActivity({ className, groups, delay }: { className?: string; groups: Group[]; delay: number }) {
  const all = groups
    .flatMap((g) => g.expenses.map((e) => ({ ...e, groupName: g.name, currency: g.currency })))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 5);

  return (
    <div className={cn("card-surface p-5 card-lift animate-float-up", className)} style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Recent Activity</h3>
        <button className="text-xs font-semibold text-primary hover:underline">View all</button>
      </div>
      {all.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No expenses yet</div>
      ) : (
        <div className="space-y-2.5">
          {all.map((e) => {
            const d = new Date(e.date);
            const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMM d");
            return (
              <div key={e.id} className="flex items-center gap-3">
                <CategoryIcon category={e.category} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{e.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{e.groupName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono-num font-bold text-sm">{e.currency}{e.amount.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BalancesPanel({
  className, stats, onSettle, delay,
}: { className?: string; stats: ReturnType<typeof computeStats>; onSettle: (g: Group) => void; delay: number }) {
  const { topBalances, primaryGroup } = stats;
  return (
    <div className={cn("card-surface p-5 card-lift animate-float-up flex flex-col", className)} style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Your Balances</h3>
        <button className="text-xs font-semibold text-primary hover:underline">View all</button>
      </div>
      {topBalances.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8 text-sm text-muted-foreground text-center">
          You're all settled up ✨
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {topBalances.map((b, i) => {
            const tone = Math.abs(b.amount) < 0.01 ? "muted" : b.direction === "owed" ? "success" : "danger";
            return (
              <div key={i} className="flex items-center gap-2.5">
                <MemberAvatar member={b.member} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{b.member.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {tone === "muted" ? "settled up" : b.direction === "owed" ? "owes you" : "you owe"}
                  </p>
                </div>
                <span className={cn("font-mono-num font-bold text-sm",
                  tone === "success" && "text-success",
                  tone === "danger" && "text-destructive",
                  tone === "muted" && "text-muted-foreground"
                )}>
                  ₹{Math.abs(b.amount).toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {primaryGroup && (
        <button
          onClick={() => onSettle(primaryGroup)}
          className="mt-4 w-full bg-gradient-violet text-white rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity shadow-glow"
        >
          Settle Up Now
        </button>
      )}
    </div>
  );
}

function BudgetProgressCard({ className, delay, personal }: {
  className?: string;
  delay: number;
  personal: ReturnType<typeof usePersonal>;
}) {
  const monthStart = startOfMonth(new Date()).toISOString();
  const monthlyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of personal.expenses) {
      if (e.date >= monthStart) totals[e.category] = (totals[e.category] ?? 0) + e.amount;
    }
    return totals;
  }, [personal.expenses, monthStart]);

  return (
    <div className={cn("card-surface p-5 card-lift animate-float-up", className)} style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Budget Progress</h3>
        <Link to="/personal?tab=budgets" className="text-xs font-semibold text-primary hover:underline">View all</Link>
      </div>
      {personal.budgets.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          <p>No budgets set yet</p>
          <Link to="/personal?tab=budgets" className="text-primary font-semibold text-xs hover:underline mt-1 inline-block">
            Create your first budget →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {personal.budgets.slice(0, 4).map((b) => {
            const spent = monthlyTotals[b.category] ?? 0;
            const pct = Math.min(100, (spent / b.monthlyLimit) * 100);
            const over = spent > b.monthlyLimit;
            return (
              <div key={b.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs">{b.category}</span>
                  <span className={cn("font-mono-num text-xs", over ? "text-destructive font-bold" : "text-muted-foreground")}>
                    ₹{spent.toFixed(0)} / ₹{b.monthlyLimit.toFixed(0)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", over ? "bg-destructive" : "")}
                    style={{ width: `${pct}%`, background: over ? undefined : `hsl(var(--cat-${b.category.toLowerCase()}))` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WhoOwesWhom({ className, stats, delay }: { className?: string; stats: ReturnType<typeof computeStats>; delay: number }) {
  const { orbitNodes } = stats;
  const meName = store.getMeName();

  return (
    <div className={cn("card-surface p-5 card-lift animate-float-up overflow-hidden", className)} style={{ animationDelay: `${delay}s` }}>
      <h3 className="font-bold mb-4">Who Owes Whom</h3>
      {orbitNodes.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No outstanding debts ✨</div>
      ) : (
        <div className="relative h-[260px] flex items-center justify-center">
          {/* Center: You */}
          <div className="absolute z-10 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-gradient-violet flex items-center justify-center text-white font-extrabold text-xl shadow-glow">
              {meName.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-bold mt-1.5">You</p>
            <p className={cn("text-xs font-mono-num font-bold",
              stats.youNet > 0 ? "text-success" : stats.youNet < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {stats.youNet === 0 ? "settled" : `${stats.youNet > 0 ? "+" : ""}₹${stats.youNet.toFixed(0)}`}
            </p>
          </div>
          {/* Orbit nodes — distribute around */}
          {orbitNodes.slice(0, 4).map((n, i) => {
            const angle = (i / Math.min(4, orbitNodes.length)) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * 95;
            const y = Math.sin(angle) * 95;
            return (
              <div key={n.member.id}
                className="absolute flex flex-col items-center animate-pop-in"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  animationDelay: `${0.5 + i * 0.08}s`,
                }}
              >
                <MemberAvatar member={n.member} size="md" />
                <div className={cn("mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap",
                  n.amount === 0 ? "bg-secondary text-muted-foreground" :
                  n.direction === "owed" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                )}>
                  {n.amount === 0 ? "settled" : `${n.direction === "owed" ? "owes you" : "you owe"} ₹${n.amount.toFixed(0)}`}
                </div>
              </div>
            );
          })}
          {/* connecting lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="-150 -150 300 300">
            {orbitNodes.slice(0, 4).map((n, i) => {
              const angle = (i / Math.min(4, orbitNodes.length)) * Math.PI * 2 - Math.PI / 2;
              const x = Math.cos(angle) * 95;
              const y = Math.sin(angle) * 95;
              const color = n.amount === 0 ? "hsl(var(--muted-foreground) / 0.2)"
                : n.direction === "owed" ? "hsl(var(--success) / 0.4)" : "hsl(var(--destructive) / 0.4)";
              return (
                <line key={n.member.id} x1="0" y1="0" x2={x} y2={y}
                  stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

function answerQuery(q: string, stats: ReturnType<typeof computeStats>, groups: Group[]): string {
  const lower = q.toLowerCase();
  const { catTotals, total, totalOwed, totalOwing, topBalances, spentMonth } = stats;
  const meName = store.getMeName();

  if (total === 0 && groups.length === 0)
    return "You don't have any expenses yet. Create a group and add expenses to get insights!";

  if (lower.includes("most") && (lower.includes("spend") || lower.includes("spent") || lower.includes("category"))) {
    const top = (Object.entries(catTotals) as [Category, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    if (!top.length) return "No expenses recorded yet.";
    const [cat, val] = top[0];
    const pct = Math.round((val / total) * 100);
    return `Your top category is ${cat} at ₹${val.toFixed(0)} (${pct}% of total spending).`;
  }

  if (lower.includes("trend") || lower.includes("month")) {
    if (spentMonth === 0) return "No spending recorded this month yet.";
    return `You've spent ₹${spentMonth.toFixed(0)} this month across ${groups.reduce((s, g) => s + g.expenses.length, 0)} expenses.`;
  }

  if (lower.includes("owe") && (lower.includes("who") || lower.includes("most"))) {
    const owes = topBalances.filter((b) => b.direction === "owed");
    if (!owes.length) return "Nobody owes you anything right now — all settled up! ✨";
    const top = owes.sort((a, b) => b.amount - a.amount)[0];
    return `${top.member.name} owes you the most: ₹${top.amount.toFixed(0)}.`;
  }

  if (lower.includes("owe") || lower.includes("balance")) {
    if (totalOwing === 0 && totalOwed === 0) return "You're fully settled up across all groups! ✨";
    const parts = [];
    if (totalOwing > 0) parts.push(`you owe ₹${totalOwing.toFixed(0)}`);
    if (totalOwed > 0) parts.push(`you're owed ₹${totalOwed.toFixed(0)}`);
    return `Overall, ${parts.join(" and ")}.`;
  }

  if (lower.includes("group")) {
    if (!groups.length) return "You have no groups yet. Create one to start splitting!";
    return `You have ${groups.length} group${groups.length > 1 ? "s" : ""}: ${groups.map((g) => g.name).join(", ")}.`;
  }

  if (lower.includes("total") || lower.includes("how much")) {
    if (total === 0) return "No expenses recorded yet.";
    return `Your total tracked spending is ₹${total.toFixed(0)} across all groups.`;
  }

  // Fallback: summary
  if (total === 0) return "Add some expenses to your groups and I can give you insights!";
  const topCat = (Object.entries(catTotals) as [Category, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0];
  return `You've spent ₹${total.toFixed(0)} total. Top category: ${topCat?.[0] ?? "N/A"}. Net balance: ${totalOwed - totalOwing >= 0 ? "+" : ""}₹${(totalOwed - totalOwing).toFixed(0)}.`;
}

function AIAssistantCard({ className, delay, stats, groups }: {
  className?: string;
  delay: number;
  stats: ReturnType<typeof computeStats>;
  groups: Group[];
}) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const suggestions = [
    "What did I spend the most on?",
    "Show my spending trends",
    "Who owes me the most?",
  ];

  const handleSubmit = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setAnswer(answerQuery(trimmed, stats, groups));
    setQ("");
  };

  return (
    <div className={cn("card-surface p-5 card-lift animate-float-up flex flex-col", className)} style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-gradient-violet flex items-center justify-center shadow-glow">
          <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <h3 className="font-bold">AI Assistant</h3>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gradient-coral text-white">BETA</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Ask me anything about your expenses</p>
      {answer ? (
        <div className="flex-1 rounded-xl bg-gradient-card border border-primary/15 p-3 text-sm leading-relaxed mb-3">
          <p>{answer}</p>
          <button onClick={() => setAnswer(null)} className="mt-2 text-xs text-primary hover:underline">Ask another</button>
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSubmit(s)}
              className="w-full text-left text-xs px-3 py-2 rounded-lg bg-secondary/60 hover:bg-secondary hover:text-foreground text-muted-foreground transition-colors flex items-center gap-2"
            >
              <Sparkles className="h-3 w-3 text-primary shrink-0" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 bg-secondary/60 rounded-xl px-3 py-2 border border-border focus-within:border-primary transition-colors">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(q)}
          placeholder="Ask anything..."
          className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={() => handleSubmit(q)}
          className="h-7 w-7 rounded-lg bg-gradient-violet text-white flex items-center justify-center hover:opacity-90 shadow-glow shrink-0"
        >
          <Send className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ================================================================ */
/* Stats computation                                                 */
/* ================================================================ */

function computeStats(groups: Group[]) {
  let totalOwed = 0;
  let totalOwing = 0;
  const catTotals: Record<Category, number> = {
    Food: 0, Travel: 0, Stay: 0, Utilities: 0, Entertainment: 0, Shopping: 0, Health: 0, Other: 0,
  };
  let total = 0;
  let spentMonth = 0;
  const monthStart = startOfMonth(new Date()).toISOString();

  // 30-day spark series
  const monthSpark: number[] = Array(14).fill(0);
  const owingSpark: number[] = Array(14).fill(0);
  const owedSpark: number[] = Array(14).fill(0);

  // For balances panel: aggregate across all groups by member name
  const memberBalances: Record<string, { member: any; amount: number; direction: "owed" | "owes" }> = {};
  let primaryGroup: Group | null = null;
  let maxAbs = 0;

  for (const g of groups) {
    const myShareTotal = g.expenses.reduce((s, e) => {
      const myShare = e.splits.find((sp) => sp.memberId === g.meMemberId)?.amount ?? 0;
      catTotals[e.category] += myShare;
      total += myShare;
      if (e.date >= monthStart) spentMonth += myShare;
      // populate spark for past 14 days
      const idx = 13 - Math.min(13, Math.floor((Date.now() - +new Date(e.date)) / 86400000));
      if (idx >= 0 && idx < 14) monthSpark[idx] += myShare;
      return s + myShare;
    }, 0);

    const net = computeNetBalances(g.members, g.expenses, g.settlements);
    const meNet = net.find((n) => n.memberId === g.meMemberId)?.net ?? 0;
    if (meNet > 0) totalOwed += meNet;
    else if (meNet < 0) totalOwing += -meNet;
    if (Math.abs(meNet) > maxAbs) { maxAbs = Math.abs(meNet); primaryGroup = g; }

    // Pairwise edges from simplified
    const edges = simplifyDebts(net);
    for (const e of edges) {
      if (e.from === g.meMemberId) {
        const m = g.members.find((mm) => mm.id === e.to)!;
        if (!m) continue;
        const k = m.id;
        memberBalances[k] = { member: m, amount: (memberBalances[k]?.amount ?? 0) + e.amount, direction: "owes" };
      } else if (e.to === g.meMemberId) {
        const m = g.members.find((mm) => mm.id === e.from)!;
        if (!m) continue;
        const k = m.id;
        memberBalances[k] = { member: m, amount: (memberBalances[k]?.amount ?? 0) + e.amount, direction: "owed" };
      }
    }
    // Also include members with zero balance so they appear in WhoOwesWhom
    for (const m of g.members) {
      if (m.id === g.meMemberId) continue;
      if (!memberBalances[m.id]) {
        memberBalances[m.id] = { member: m, amount: 0, direction: "owed" };
      }
    }
  }

  // Build sparks for owing/owed by simply scaling monthSpark for visual demo
  for (let i = 0; i < 14; i++) {
    owingSpark[i] = Math.max(0, totalOwing * (0.5 + Math.sin(i * 0.7) * 0.3 + i / 28));
    owedSpark[i] = Math.max(0, totalOwed * (0.5 + Math.cos(i * 0.5) * 0.3 + i / 24));
  }

  const topBalances = Object.values(memberBalances)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const orbitNodes = topBalances;
  const youNet = totalOwed - totalOwing;

  // Insight
  const topCat = (Object.entries(catTotals) as [Category, number][]).sort((a, b) => b[1] - a[1])[0];
  const topInsight = topCat && topCat[1] > 0
    ? `You spent ${Math.round((topCat[1] / Math.max(1, total)) * 100)}% on ${topCat[0]} this month — your top category.`
    : groups.length === 0
    ? "Create your first group to start tracking and see AI-powered insights here."
    : "Add a few expenses to unlock personalized insights.";

  const spentChange = 0;

  return {
    totalOwed, totalOwing, catTotals, total, spentMonth, monthSpark, owingSpark, owedSpark,
    topBalances, primaryGroup, orbitNodes, youNet, topInsight,
  };
}
