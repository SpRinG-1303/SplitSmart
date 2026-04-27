import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/TopNav";
import { ArrowRight, Sparkles, Zap, TrendingUp, Brain, Receipt, Users } from "lucide-react";
import { store } from "@/lib/store";

export default function Landing() {
  const navigate = useNavigate();

  const handleStart = () => {
    store.seedIfEmpty();
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        right={
          <Button onClick={handleStart} variant="ghost" size="sm" className="font-semibold">
            Open app →
          </Button>
        }
      />

      {/* HERO */}
      <section className="container max-w-5xl pt-16 pb-24 md:pt-24 md:pb-32 text-center relative overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(245 100% 70% / 0.5), transparent 60%)" }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light text-primary-deep text-xs font-semibold mb-6 animate-float-up">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered expense splitting
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] animate-float-up" style={{ animationDelay: "0.05s" }}>
            Split expenses.
            <br />
            <span className="gradient-text">Not friendships.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto animate-float-up" style={{ animationDelay: "0.1s" }}>
            Type "Pizza ₹800 split with Aman and Priya" — we handle the math, the categories, and the awkward reminders.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center animate-float-up" style={{ animationDelay: "0.15s" }}>
            <Button onClick={handleStart} size="lg" className="bg-gradient-hero hover:opacity-90 text-white font-semibold shadow-lift gap-2 h-12 px-7 rounded-xl">
              Create a group — Free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={handleStart} variant="outline" size="lg" className="font-semibold h-12 px-7 rounded-xl">
              Try the demo group
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No signup required. Works offline.</p>

          {/* Floating cards */}
          <div className="mt-16 relative h-72 hidden md:block">
            <FloatingCard className="absolute left-[18%] top-4 -rotate-6" delay={0.3}
              emoji="🏖️" title="Goa Trip 2025" amt="₹24,500" sub="4 members"
            />
            <FloatingCard className="absolute right-[22%] top-2 rotate-6 z-10" delay={0.5}
              emoji="🍕" title="Dinner at Smoke House" amt="₹1,200" sub="Auto-tagged · Food"
              accent="food"
            />
            <FloatingCard className="absolute left-1/2 -translate-x-1/2 top-28 z-20 scale-110" delay={0.7}
              emoji="✨" title="Aman pays Priya" amt="₹650" sub="Settles 3 debts at once"
              accent="primary"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container max-w-5xl py-16 border-t border-border">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-3">
          Built for the way you actually spend
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Three things that make this not-just-another-Splitwise.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard icon={<Brain />} title="Natural language entry" desc="Type one sentence — we extract amount, category, members, and split. The form fills itself." gradient="from-primary to-primary-deep" />
          <FeatureCard icon={<Zap />} title="Auto-categorized" desc="Every expense is tagged the second you type the title. No dropdowns. No second-guessing." gradient="from-accent to-primary" />
          <FeatureCard icon={<TrendingUp />} title="AI spending insights" desc="Conversational summaries: where the money went, who's owed what, who pays whom." gradient="from-pink-500 to-orange-500" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container max-w-5xl py-16 border-t border-border">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">
          From chaos to settled in 3 steps
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          <Step n="1" icon={<Users />} title="Create a group" desc="Pick an emoji, add member names. Done in 10 seconds." />
          <Step n="2" icon={<Receipt />} title="Add expenses" desc="Type naturally or fill the form. AI tags each one." />
          <Step n="3" icon={<Sparkles />} title="Settle up" desc="One-click simplified debts. Mark as paid, watch it clear." />
        </div>
      </section>

      <footer className="border-t border-border mt-16">
        <div className="container max-w-5xl py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>SplitSmart · Built with ❤️ in 24 hours</p>
          <p>No accounts, no ads, no nonsense.</p>
        </div>
      </footer>
    </div>
  );
}

function FloatingCard({
  className, delay = 0, emoji, title, amt, sub, accent,
}: {
  className?: string; delay?: number; emoji: string; title: string; amt: string; sub: string;
  accent?: "primary" | "food";
}) {
  const accentBg = accent === "primary" ? "bg-gradient-hero text-white" : accent === "food" ? "bg-gradient-sunset text-white" : "bg-card";
  return (
    <div
      className={`${className} w-72 rounded-2xl ${accentBg} ${accent ? "" : "border border-border"} shadow-lift p-4 animate-float-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-3">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl ${accent ? "bg-white/20" : "bg-secondary"}`}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{title}</p>
          <p className={`text-xs ${accent ? "opacity-80" : "text-muted-foreground"}`}>{sub}</p>
        </div>
        <p className="font-mono-num font-bold">{amt}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, gradient }: { icon: React.ReactNode; title: string; desc: string; gradient: string; }) {
  return (
    <div className="card-surface card-lift p-6">
      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center mb-4 shadow-glow`}>
        <div className="[&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      </div>
      <h3 className="font-bold text-lg mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ n, icon, title, desc }: { n: string; icon: React.ReactNode; title: string; desc: string; }) {
  return (
    <div className="card-surface p-6 relative">
      <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-gradient-hero text-white text-sm font-bold flex items-center justify-center shadow-lift">
        {n}
      </div>
      <div className="text-primary mb-3 [&>svg]:h-6 [&>svg]:w-6">{icon}</div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
