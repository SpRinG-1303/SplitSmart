import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/MemberAvatar";
import type { Group } from "@/lib/types";
import { computeNetBalances, simplifyDebts, type DebtEdge } from "@/lib/balance";
import { store } from "@/lib/store";
import { ArrowRight, Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: Group;
  /** Optional: settle a specific edge */
  edge?: DebtEdge | null;
}

export function SettleUpDialog({ open, onOpenChange, group, edge }: Props) {
  const [confettiBurst, setConfettiBurst] = useState(false);

  useEffect(() => {
    if (!open) setConfettiBurst(false);
  }, [open]);

  const balances = computeNetBalances(group.members, group.expenses, group.settlements);
  const allEdges = simplifyDebts(balances);
  const edges = edge ? [edge] : allEdges;

  const memberById = (id: string) => group.members.find((m) => m.id === id);

  const handleMarkPaid = (e: DebtEdge) => {
    store.addSettlement(group.id, {
      fromMemberId: e.from,
      toMemberId: e.to,
      amount: e.amount,
      method: "Manual",
    });
    setConfettiBurst(true);
    toast.success("Marked as paid 🎉");
    setTimeout(() => {
      const next = simplifyDebts(computeNetBalances(group.members, store.get(group.id)!.expenses, store.get(group.id)!.settlements));
      if (next.length === 0) {
        setTimeout(() => onOpenChange(false), 1200);
      }
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 rounded-2xl border-0 shadow-modal overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Settle up</h2>
            <p className="text-xs text-muted-foreground">
              {edges.length === 0 ? "All clear!" : `${edges.length} ${edges.length === 1 ? "transaction" : "transactions"} to clear ${group.name}`}
            </p>
          </div>
          <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto relative">
          {confettiBurst && <ConfettiBurst />}

          {edges.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 mx-auto rounded-full bg-success/10 text-success flex items-center justify-center text-3xl mb-3">
                ✓
              </div>
              <p className="font-bold text-lg">All settled!</p>
              <p className="text-muted-foreground text-sm mt-1">Nothing owed in this group.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {!edge && allEdges.length > 1 && (
                <div className="bg-gradient-card border border-primary/20 rounded-xl p-3 flex items-start gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">
                    <span className="font-semibold">Simplified.</span> These are the fewest payments needed to settle everyone.
                  </p>
                </div>
              )}
              {edges.map((e, i) => {
                const from = memberById(e.from);
                const to = memberById(e.to);
                if (!from || !to) return null;
                return (
                  <div key={i} className="card-surface p-4 animate-pop-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <MemberAvatar member={from} size="md" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pays</p>
                          <p className="font-semibold text-sm truncate">{from.id === group.meMemberId ? "You" : from.name}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex items-center gap-2 flex-1 justify-end text-right">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Receives</p>
                          <p className="font-semibold text-sm truncate">{to.id === group.meMemberId ? "You" : to.name}</p>
                        </div>
                        <MemberAvatar member={to} size="md" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3">
                      <span className="text-xs text-muted-foreground font-semibold uppercase">Amount</span>
                      <span className="font-mono-num font-bold text-xl">{group.currency}{e.amount.toFixed(2)}</span>
                    </div>
                    <Button onClick={() => handleMarkPaid(e)}
                      className="mt-3 w-full bg-gradient-mint hover:opacity-90 text-white font-semibold rounded-xl gap-1.5">
                      <Check className="h-4 w-4" /> Mark as paid
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfettiBurst() {
  const colors = ["#6C63FF", "#00D4AA", "#FFAD0D", "#FF5A5F", "#FF6B9D"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center">
      {Array.from({ length: 24 }).map((_, i) => {
        const c = colors[i % colors.length];
        const x = (Math.random() - 0.5) * 240;
        const dur = 0.8 + Math.random() * 0.4;
        return (
          <span key={i} className="absolute h-2 w-2 rounded-sm" style={{
            backgroundColor: c, left: "50%", top: "50%",
            animation: `confetti ${dur}s ease-out forwards`,
            transform: `translate(${x}px, 0)`,
          }} />
        );
      })}
    </div>
  );
}
