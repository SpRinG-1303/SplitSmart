import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, TrendingUp, Brain, Receipt, Users, Check, Star } from "lucide-react";

export default function Cover() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const parallaxX = (mousePos.x - 0.5) * 30;
  const parallaxY = (mousePos.y - 0.5) * 20;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 glass border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-lg tracking-tight">SplitSmart</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="h-9 px-5 rounded-xl bg-gradient-hero text-white text-sm font-semibold shadow-glow hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Get started free
        </button>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">

        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[700px] h-[700px] rounded-full opacity-25 blur-[120px]"
            style={{
              background: "radial-gradient(circle, hsl(252 95% 65%), hsl(285 90% 65%), transparent 70%)",
              top: "10%", left: "50%",
              transform: `translate(calc(-50% + ${parallaxX}px), calc(0% + ${parallaxY}px))`,
              transition: "transform 0.1s ease-out",
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[80px]"
            style={{
              background: "radial-gradient(circle, hsl(330 85% 65%), transparent 70%)",
              bottom: "20%", right: "10%",
              transform: `translate(${-parallaxX * 0.5}px, ${-parallaxY * 0.5}px)`,
              transition: "transform 0.15s ease-out",
            }}
          />
          <div
            className="absolute w-[300px] h-[300px] rounded-full opacity-15 blur-[60px]"
            style={{
              background: "radial-gradient(circle, hsl(178 95% 45%), transparent 70%)",
              top: "30%", left: "5%",
              transform: `translate(${parallaxX * 0.3}px, ${parallaxY * 0.3}px)`,
              transition: "transform 0.2s ease-out",
            }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern opacity-[0.03] pointer-events-none" />

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${4 + (i % 3) * 3}px`,
                height: `${4 + (i % 3) * 3}px`,
                background: `hsl(${252 + i * 15} 95% 70% / 0.4)`,
                left: `${8 + i * 8}%`,
                top: `${15 + (i % 5) * 15}%`,
                animation: `float-up ${2 + i * 0.3}s cubic-bezier(0.4,0,0.2,1) both`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-xs font-semibold text-primary mb-8 animate-float-up"
            style={{ animationDelay: "0s" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            AI-powered expense splitting · Free forever
            <Sparkles className="h-3 w-3" />
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.02] animate-float-up"
            style={{ animationDelay: "0.08s" }}
          >
            Split expenses.
            <br />
            <span className="gradient-text">Not friendships.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-float-up"
            style={{ animationDelay: "0.16s" }}
          >
            Type <span className="text-foreground font-semibold">"Pizza ₹800 split with Aman and Priya"</span> — we handle the math, the categories, and the awkward reminders.
          </p>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-col sm:flex-row gap-3 animate-float-up"
            style={{ animationDelay: "0.24s" }}
          >
            <button
              onClick={() => navigate("/login")}
              className="group relative h-14 px-8 rounded-2xl bg-gradient-hero text-white font-bold text-base shadow-glow hover:opacity-95 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center gap-2.5 overflow-hidden"
            >
              <span className="relative z-10">Get started — it's free</span>
              <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="h-14 px-8 rounded-2xl glass border border-border hover:border-primary/40 font-semibold text-base hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              See a demo
            </button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground animate-float-up" style={{ animationDelay: "0.3s" }}>
            No credit card · No signup required · Works offline
          </p>

          {/* Social proof */}
          <div className="mt-8 flex items-center gap-3 animate-float-up" style={{ animationDelay: "0.36s" }}>
            <div className="flex -space-x-2">
              {["🧑‍💻", "👩‍🎨", "🧑‍🍳", "👩‍🚀", "🧑‍🎤"].map((e, i) => (
                <div key={i} className="h-8 w-8 rounded-full glass border-2 border-background flex items-center justify-center text-sm">
                  {e}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-warning text-warning" />)}
              </div>
              <p className="text-xs text-muted-foreground">Loved by 2,000+ groups</p>
            </div>
          </div>

          {/* Floating UI cards */}
          <div className="mt-16 relative w-full max-w-3xl h-64 hidden md:block animate-float-up" style={{ animationDelay: "0.4s" }}>
            <FloatingCard
              className="absolute left-[5%] top-4"
              style={{ transform: `rotate(-6deg) translate(${parallaxX * 0.2}px, ${parallaxY * 0.2}px)`, transition: "transform 0.1s ease-out" }}
              emoji="🏖️" title="Goa Trip 2025" amt="₹24,500" sub="4 members · 12 expenses"
            />
            <FloatingCard
              className="absolute right-[8%] top-0"
              style={{ transform: `rotate(5deg) translate(${-parallaxX * 0.15}px, ${parallaxY * 0.15}px)`, transition: "transform 0.12s ease-out" }}
              emoji="🍕" title="Dinner at Smoke House" amt="₹1,200" sub="Auto-tagged · Food" accent="coral"
            />
            <FloatingCard
              className="absolute left-1/2 top-20 z-20 scale-110"
              style={{ transform: `translateX(-50%) scale(1.1) translate(${parallaxX * 0.05}px, ${parallaxY * 0.05}px)`, transition: "transform 0.08s ease-out" }}
              emoji="✨" title="Aman pays Priya" amt="₹650" sub="Settles 3 debts at once" accent="primary"
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float-up" style={{ animationDelay: "0.8s" }}>
          <p className="text-xs text-muted-foreground">Scroll to explore</p>
          <div className="h-10 w-6 rounded-full border-2 border-border flex items-start justify-center pt-1.5">
            <div className="h-2 w-1 rounded-full bg-primary" style={{ animation: "float-up 1.5s ease-in-out infinite alternate" }} />
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="border-y border-border bg-card/50 backdrop-blur-sm py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: "₹2Cr+", label: "Expenses tracked" },
            { val: "50K+", label: "Debts simplified" },
            { val: "2,000+", label: "Groups created" },
            { val: "100%", label: "Free forever" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-mono-num font-extrabold text-3xl gradient-text">{s.val}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Zap className="h-3 w-3" /> Why SplitSmart
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Built for the way you<br />
            <span className="gradient-text">actually spend money</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Three things that make this not-just-another-Splitwise.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard
            icon={<Brain className="h-5 w-5" />}
            title="Natural language entry"
            desc="Type one sentence — we extract amount, category, members, and split. The form fills itself."
            gradient="from-violet-500 to-purple-600"
            glow="shadow-glow"
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Auto-categorized"
            desc="Every expense is tagged the second you type the title. No dropdowns. No second-guessing."
            gradient="from-cyan-500 to-blue-500"
            glow="shadow-glow-mint"
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="AI spending insights"
            desc="Conversational summaries: where the money went, who's owed what, who pays whom."
            gradient="from-pink-500 to-orange-500"
            glow="shadow-glow-coral"
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              From chaos to settled<br />
              <span className="gradient-text">in 3 steps</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <Step n="1" icon={<Users className="h-6 w-6" />} title="Create a group" desc="Pick an emoji, add member names. Done in 10 seconds." color="hsl(252 95% 65%)" />
            <Step n="2" icon={<Receipt className="h-6 w-6" />} title="Add expenses" desc="Type naturally or fill the form. AI tags each one instantly." color="hsl(178 95% 45%)" />
            <Step n="3" icon={<Sparkles className="h-6 w-6" />} title="Settle up" desc="One-click simplified debts. Mark as paid, watch it clear." color="hsl(330 85% 65%)" />
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Simple pricing.<br />
            <span className="gradient-text">Always free.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">No hidden fees. No premium tiers. Just split.</p>
        </div>
        <div className="max-w-sm mx-auto">
          <div className="card-surface p-8 relative overflow-hidden animate-pulse-glow">
            <div className="absolute inset-0 bg-gradient-card opacity-60" />
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: "hsl(252 95% 65%)" }} />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-hero text-white text-xs font-bold mb-4">
                <Sparkles className="h-3 w-3" /> Free forever
              </div>
              <p className="font-mono-num font-extrabold text-5xl">₹0</p>
              <p className="text-muted-foreground text-sm mt-1">per month, forever</p>
              <ul className="mt-6 space-y-3">
                {[
                  "Unlimited groups & members",
                  "AI natural language parsing",
                  "Auto expense categorization",
                  "Debt simplification",
                  "UPI & Razorpay payments",
                  "Spending insights & charts",
                  "Personal budget tracker",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/login")}
                className="mt-8 w-full h-12 rounded-xl bg-gradient-hero text-white font-bold shadow-glow hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Start for free <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-pink-500/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[100px] opacity-20"
            style={{ background: "var(--gradient-hero)" }} />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Ready to stop<br />
            <span className="gradient-text">doing the math?</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Join thousands of groups who've settled up without the awkwardness.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-10 h-14 px-10 rounded-2xl bg-gradient-hero text-white font-bold text-lg shadow-glow hover:opacity-95 hover:scale-[1.03] active:scale-[0.98] transition-all inline-flex items-center gap-2.5"
          >
            Get started free <ArrowRight className="h-5 w-5" />
          </button>
          <p className="mt-4 text-xs text-muted-foreground">No signup required · Works offline · Always free</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-foreground">SplitSmart</span>
            <span>· Built with ❤️</span>
          </div>
          <p>No accounts required · No ads · No nonsense.</p>
        </div>
      </footer>
    </div>
  );
}

function FloatingCard({ className, style, emoji, title, amt, sub, accent }: {
  className?: string;
  style?: React.CSSProperties;
  emoji: string;
  title: string;
  amt: string;
  sub: string;
  accent?: "primary" | "coral";
}) {
  const bg = accent === "primary"
    ? "bg-gradient-hero text-white shadow-glow"
    : accent === "coral"
    ? "bg-gradient-coral text-white shadow-glow-coral"
    : "card-surface";
  return (
    <div className={`${className} w-64 rounded-2xl ${bg} p-4`} style={style}>
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${accent ? "bg-white/20" : "bg-secondary"}`}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{title}</p>
          <p className={`text-xs truncate ${accent ? "opacity-75" : "text-muted-foreground"}`}>{sub}</p>
        </div>
        <p className="font-mono-num font-bold text-sm shrink-0">{amt}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, gradient, glow }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  gradient: string;
  glow: string;
}) {
  return (
    <div className="card-surface card-lift p-6 group">
      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center mb-5 ${glow} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ n, icon, title, desc, color }: {
  n: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="card-surface p-6 relative text-center group card-lift">
      <div
        className="h-14 w-14 rounded-2xl mx-auto flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}99)`, boxShadow: `0 0 30px -6px ${color}80` }}
      >
        {icon}
      </div>
      <div
        className="absolute -top-3 -right-3 h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-lift"
        style={{ background: color }}
      >
        {n}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
