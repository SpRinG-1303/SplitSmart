import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/TopNav";
import { useGroups } from "@/lib/useGroups";
import { computeNetBalances, simplifyDebts } from "@/lib/balance";
import { MemberStack } from "@/components/MemberAvatar";
import { Plus, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { NumberTicker } from "@/components/NumberTicker";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { formatDistanceToNow } from "date-fns";
import { store } from "@/lib/store";

export default function Home() {
  const groups = useGroups();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const meName = store.getMeName();

  const { totalOwed, totalOwing } = useMemo(() => {
    let owed = 0;
    let owing = 0;
    groups.forEach((g) => {
      const net = computeNetBalances(g.members, g.expenses, g.settlements);
      const me = net.find((b) => b.memberId === g.meMemberId);
      if (me) {
        if (me.net > 0) owed += me.net;
        else owing += -me.net;
      }
    });
    return { totalOwed: owed, totalOwing: owing };
  }, [groups]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopNav
        right={
          <Button onClick={() => setOpen(true)} size="sm" className="bg-gradient-hero hover:opacity-90 text-white gap-1.5 font-semibold rounded-lg">
            <Plus className="h-4 w-4" /> New group
          </Button>
        }
      />

      <main className="container max-w-3xl pt-8 md:pt-12">
        {/* Greeting */}
        <div className="animate-float-up">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {greeting}, {meName} 👋
          </h1>
          <p className="text-muted-foreground mt-1.5">
            {groups.length === 0
              ? "Let's create your first group."
              : `You have ${groups.length} ${groups.length === 1 ? "group" : "groups"}.`}
          </p>

          {groups.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              <SummaryPill
                tone="success"
                icon={<ArrowDownRight />}
                label="You're owed"
                value={totalOwed}
              />
              <SummaryPill
                tone="danger"
                icon={<ArrowUpRight />}
                label="You owe"
                value={totalOwing}
              />
            </div>
          )}
        </div>

        {/* Groups */}
        <section className="mt-10">
          {groups.length === 0 ? (
            <EmptyState onCreate={() => setOpen(true)} />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your groups</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {groups.map((g, i) => {
                  const net = computeNetBalances(g.members, g.expenses, g.settlements);
                  const me = net.find((b) => b.memberId === g.meMemberId)?.net ?? 0;
                  const total = g.expenses.reduce((s, e) => s + e.amount, 0);
                  const tone = Math.abs(me) < 0.01 ? "muted" : me > 0 ? "success" : "danger";
                  const last = g.activity[0]?.at ?? g.createdAt;
                  return (
                    <Link
                      key={g.id}
                      to={`/group/${g.id}`}
                      className="card-surface card-lift p-5 group animate-float-up"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                          style={{ backgroundColor: `hsl(${g.color} / 0.14)` }}
                        >
                          {g.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate">{g.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {g.members.length} members · {g.currency}{total.toFixed(0)} total
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <MemberStack members={g.members} />
                        <div className="text-right">
                          <p
                            className={`font-mono-num font-bold text-base ${
                              tone === "success" ? "text-success" : tone === "danger" ? "text-destructive" : "text-muted-foreground"
                            }`}
                          >
                            {tone === "muted" ? "Settled ✓" : `${me > 0 ? "+" : "-"}${g.currency}${Math.abs(me).toFixed(2)}`}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(last), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      <CreateGroupDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(g) => navigate(`/group/${g.id}`)}
      />
    </div>
  );
}

function SummaryPill({ tone, icon, label, value }: { tone: "success" | "danger"; icon: React.ReactNode; label: string; value: number; }) {
  const c = tone === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive";
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${c}`}>
      <div className="[&>svg]:h-4 [&>svg]:w-4">{icon}</div>
      <span className="text-xs font-semibold opacity-80">{label}</span>
      <NumberTicker value={value} prefix="₹" decimals={2} className="font-mono-num font-bold text-sm" />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card-surface p-10 text-center">
      <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-card flex items-center justify-center text-4xl mb-4">
        💸
      </div>
      <h3 className="font-bold text-lg">No groups yet</h3>
      <p className="text-muted-foreground text-sm mt-1 mb-5">Create your first one and start splitting in seconds.</p>
      <Button onClick={onCreate} className="bg-gradient-hero hover:opacity-90 text-white font-semibold rounded-xl gap-1.5">
        <Sparkles className="h-4 w-4" />
        Create your first group
      </Button>
    </div>
  );
}
