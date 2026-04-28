import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPaymentSettings, savePaymentSettings, type PaymentSettings } from "@/lib/settings";
import { store } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";
import { CreditCard, Smartphone, Link as LinkIcon, User, Moon, Sun, Info, ExternalLink } from "lucide-react";

export default function Settings() {
  const [s, setS] = useState<PaymentSettings>(() => getPaymentSettings());
  const [meName, setMeName] = useState(store.getMeName());
  const { theme, set } = useTheme();

  useEffect(() => {
    setS(getPaymentSettings());
    setMeName(store.getMeName());
  }, []);

  const save = () => {
    savePaymentSettings(s);
    if (meName.trim()) store.setMeName(meName.trim());
    toast.success("Settings saved");
  };

  return (
    <AppShell title="Settings">
      <main className="px-5 lg:px-8 py-6 max-w-2xl mx-auto pb-20 space-y-6">
        <div className="animate-float-up">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Settings</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">Make it yours.</h1>
        </div>

        {/* Profile */}
        <section className="card-surface p-5">
          <h2 className="font-bold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Profile</h2>
          <div className="mt-4">
            <Label>Your name</Label>
            <Input value={meName} onChange={(e) => setMeName(e.target.value)} placeholder="You" className="mt-1.5" />
            <p className="text-xs text-muted-foreground mt-1">This appears as "You" in groups, but updates the underlying member name.</p>
          </div>
        </section>

        {/* Theme */}
        <section className="card-surface p-5">
          <h2 className="font-bold flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-warning" />} Appearance
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button key={t} onClick={() => set(t)}
                className={`p-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 capitalize ${
                  theme === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                }`}>
                {t === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Payments */}
        <section className="card-surface p-5">
          <h2 className="font-bold flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Payments</h2>
          <p className="text-xs text-muted-foreground mt-1">Configure how members can settle debts inside the app.</p>

          <div className="mt-3 bg-warning/10 border border-warning/30 rounded-xl p-3 flex gap-2">
            <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80">
              <span className="font-semibold">Test mode only.</span> Without a backend we can't verify payment signatures, so use a Razorpay <strong>test</strong> Key ID
              (<code className="px-1 py-0.5 rounded bg-muted">rzp_test_…</code>) for demos. For real money, add a backend that creates orders and verifies signatures.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <Label className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Razorpay Key ID</Label>
              <Input
                value={s.razorpayKeyId}
                onChange={(e) => setS({ ...s, razorpayKeyId: e.target.value })}
                placeholder="rzp_test_xxxxxxxxxxxxxx"
                className="mt-1.5 font-mono text-sm"
              />
              <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer"
                className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                Get your test key <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div>
              <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Payee name (you)</Label>
              <Input
                value={s.payeeName}
                onChange={(e) => setS({ ...s, payeeName: e.target.value })}
                placeholder="e.g. Aarav Sharma"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> UPI ID (for QR fallback)</Label>
              <Input
                value={s.upiId}
                onChange={(e) => setS({ ...s, upiId: e.target.value })}
                placeholder="yourname@okhdfcbank"
                className="mt-1.5 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Used to generate a UPI QR / deep link as a fallback option.</p>
            </div>

            <div>
              <Label className="flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Razorpay Payment Link (optional)</Label>
              <Input
                value={s.paymentLink}
                onChange={(e) => setS({ ...s, paymentLink: e.target.value })}
                placeholder="https://rzp.io/l/abc"
                className="mt-1.5 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Simplest option — no SDK required. We append the amount automatically.</p>
            </div>
          </div>

          <Button onClick={save} className="w-full mt-5 bg-gradient-violet hover:opacity-90 text-white font-semibold rounded-xl shadow-glow">
            Save settings
          </Button>
        </section>
      </main>
    </AppShell>
  );
}
