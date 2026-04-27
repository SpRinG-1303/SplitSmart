import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/MemberAvatar";
import type { Group } from "@/lib/types";
import { computeNetBalances, simplifyDebts, type DebtEdge } from "@/lib/balance";
import { store } from "@/lib/store";
import { ArrowRight, Check, X, Sparkles, CreditCard, Smartphone, Link as LinkIcon, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getPaymentSettings } from "@/lib/settings";
import { appendAmountToPaymentLink, buildUpiLink, payWithRazorpay } from "@/lib/razorpay";
import { QRCodeSVG } from "qrcode.react";
import { Link as RouterLink } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: Group;
  edge?: DebtEdge | null;
}

type Method = "razorpay" | "upi" | "link";

export function SettleUpDialog({ open, onOpenChange, group, edge }: Props) {
  const [confettiBurst, setConfettiBurst] = useState(false);
  const [activeEdge, setActiveEdge] = useState<DebtEdge | null>(null);
  const [method, setMethod] = useState<Method>("razorpay");
  const [settings, setSettings] = useState(() => getPaymentSettings());

  useEffect(() => {
    if (open) setSettings(getPaymentSettings());
    if (!open) { setConfettiBurst(false); setActiveEdge(null); }
  }, [open]);

  const balances = computeNetBalances(group.members, group.expenses, group.settlements);
  const allEdges = simplifyDebts(balances);
  const edges = edge ? [edge] : allEdges;
  const memberById = (id: string) => group.members.find((m) => m.id === id);

  const markPaid = (e: DebtEdge, methodLabel: string) => {
    store.addSettlement(group.id, {
      fromMemberId: e.from,
      toMemberId: e.to,
      amount: e.amount,
      method: methodLabel,
    });
    setConfettiBurst(true);
    toast.success("Marked as paid 🎉");
    setActiveEdge(null);
    setTimeout(() => {
      const next = simplifyDebts(computeNetBalances(group.members, store.get(group.id)!.expenses, store.get(group.id)!.settlements));
      if (next.length === 0) setTimeout(() => onOpenChange(false), 1200);
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 rounded-2xl border-0 shadow-modal overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">{activeEdge ? "Pay" : "Settle up"}</h2>
            <p className="text-xs text-muted-foreground">
              {activeEdge ? "Choose how you'd like to pay" : edges.length === 0 ? "All clear!" : `${edges.length} ${edges.length === 1 ? "transaction" : "transactions"} to clear ${group.name}`}
            </p>
          </div>
          <button onClick={() => activeEdge ? setActiveEdge(null) : onOpenChange(false)}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 max-h-[75vh] overflow-y-auto relative">
          {confettiBurst && <ConfettiBurst />}

          {activeEdge ? (
            <PayForm
              group={group}
              edge={activeEdge}
              method={method}
              setMethod={setMethod}
              settings={settings}
              onPaid={(label) => markPaid(activeEdge, label)}
            />
          ) : edges.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 mx-auto rounded-full bg-success/10 text-success flex items-center justify-center text-3xl mb-3">✓</div>
              <p className="font-bold text-lg">All settled!</p>
              <p className="text-muted-foreground text-sm mt-1">Nothing owed in this group.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {!edge && allEdges.length > 1 && (
                <div className="bg-gradient-card border border-primary/20 rounded-xl p-3 flex items-start gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">
                    <span className="font-semibold">Simplified.</span> Fewest payments needed to settle everyone.
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
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button onClick={() => { setActiveEdge(e); setMethod("razorpay"); }}
                        className="bg-gradient-hero hover:opacity-90 text-white font-semibold rounded-xl gap-1.5">
                        <CreditCard className="h-4 w-4" /> Pay
                      </Button>
                      <Button onClick={() => markPaid(e, "Manual")} variant="outline"
                        className="font-semibold rounded-xl gap-1.5">
                        <Check className="h-4 w-4" /> Mark paid
                      </Button>
                    </div>
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

function PayForm({
  group, edge, method, setMethod, settings, onPaid,
}: {
  group: Group;
  edge: DebtEdge;
  method: Method;
  setMethod: (m: Method) => void;
  settings: ReturnType<typeof getPaymentSettings>;
  onPaid: (methodLabel: string) => void;
}) {
  const from = group.members.find((m) => m.id === edge.from);
  const to = group.members.find((m) => m.id === edge.to);
  if (!from || !to) return null;

  const note = `${group.name} — settle up`;
  const upiLink = settings.upiId && settings.payeeName
    ? buildUpiLink({ vpa: settings.upiId, payeeName: settings.payeeName, amount: edge.amount, note })
    : "";
  const linkWithAmt = settings.paymentLink ? appendAmountToPaymentLink(settings.paymentLink, edge.amount) : "";

  const handleRazorpay = async () => {
    if (!settings.razorpayKeyId) { toast.error("Add your Razorpay Key ID in Settings."); return; }
    try {
      await payWithRazorpay({
        keyId: settings.razorpayKeyId,
        amount: edge.amount,
        name: settings.payeeName || group.name,
        description: `Settle: ${from.name} → ${to.name}`,
        payerName: from.name,
        vpa: settings.upiId || undefined,
        notes: { groupId: group.id, fromMemberId: edge.from, toMemberId: edge.to },
        onSuccess: () => onPaid("Razorpay"),
        onDismiss: () => toast.message("Payment cancelled"),
      });
    } catch (err: any) {
      toast.error(err?.message || "Couldn't open Razorpay");
    }
  };

  const tabs: { id: Method; label: string; icon: React.ReactNode }[] = [
    { id: "razorpay", label: "Razorpay", icon: <CreditCard className="h-3.5 w-3.5" /> },
    { id: "upi", label: "UPI QR", icon: <Smartphone className="h-3.5 w-3.5" /> },
    { id: "link", label: "Pay Link", icon: <LinkIcon className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4 animate-float-up">
      <div className="card-surface p-4 bg-gradient-card border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MemberAvatar member={from} size="sm" />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <MemberAvatar member={to} size="sm" />
          </div>
          <span className="font-mono-num font-bold text-xl">{group.currency}{edge.amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-1 bg-secondary/60 p-1 rounded-xl">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setMethod(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all",
              method === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            )}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {method === "razorpay" && (
        <div className="space-y-3">
          {settings.razorpayKeyId ? (
            <>
              <p className="text-xs text-muted-foreground">
                Opens Razorpay Checkout in test mode. Cards, UPI, netbanking, wallets — all supported.
              </p>
              <Button onClick={handleRazorpay} className="w-full bg-gradient-hero hover:opacity-90 text-white font-semibold rounded-xl gap-1.5 h-11">
                <CreditCard className="h-4 w-4" /> Pay {group.currency}{edge.amount.toFixed(2)} with Razorpay
              </Button>
            </>
          ) : (
            <NoSettings what="Razorpay Key ID" />
          )}
        </div>
      )}

      {method === "upi" && (
        <div className="space-y-3">
          {upiLink ? (
            <>
              <div className="card-surface p-4 flex flex-col items-center bg-white">
                <QRCodeSVG value={upiLink} size={180} bgColor="#ffffff" fgColor="#000000" level="M" includeMargin={false} />
                <p className="text-[10px] text-black/60 mt-2 font-mono">{settings.upiId}</p>
              </div>
              <p className="text-xs text-muted-foreground text-center">Scan with any UPI app · GPay · PhonePe · Paytm</p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="rounded-xl gap-1.5 font-semibold">
                  <a href={upiLink}><ExternalLink className="h-3.5 w-3.5" /> Open UPI app</a>
                </Button>
                <Button onClick={() => { navigator.clipboard.writeText(upiLink); toast.success("UPI link copied"); }}
                  variant="outline" className="rounded-xl gap-1.5 font-semibold">
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </Button>
              </div>
              <Button onClick={() => onPaid("UPI")} className="w-full bg-gradient-mint hover:opacity-90 text-white font-semibold rounded-xl gap-1.5">
                <Check className="h-4 w-4" /> I've paid
              </Button>
            </>
          ) : (
            <NoSettings what="UPI ID and payee name" />
          )}
        </div>
      )}

      {method === "link" && (
        <div className="space-y-3">
          {linkWithAmt ? (
            <>
              <p className="text-xs text-muted-foreground">
                Opens your Razorpay Payment Link with the amount pre-filled. Hosted by Razorpay — no SDK required.
              </p>
              <div className="card-surface p-3 font-mono text-xs break-all text-muted-foreground">{linkWithAmt}</div>
              <Button asChild className="w-full bg-gradient-hero hover:opacity-90 text-white font-semibold rounded-xl gap-1.5 h-11">
                <a href={linkWithAmt} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Open payment link
                </a>
              </Button>
              <Button onClick={() => onPaid("Payment Link")} variant="outline" className="w-full font-semibold rounded-xl gap-1.5">
                <Check className="h-4 w-4" /> I've paid
              </Button>
            </>
          ) : (
            <NoSettings what="Razorpay Payment Link URL" />
          )}
        </div>
      )}
    </div>
  );
}

function NoSettings({ what }: { what: string }) {
  return (
    <div className="text-center py-6 px-4">
      <p className="text-sm text-muted-foreground">Add your <span className="font-semibold text-foreground">{what}</span> to enable this option.</p>
      <Button asChild variant="outline" size="sm" className="mt-3 rounded-lg">
        <RouterLink to="/settings">Open Settings</RouterLink>
      </Button>
    </div>
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
