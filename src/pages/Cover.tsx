import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Cover() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(252 95% 65% / 0.6), transparent 60%)" }}
      />

      <div className="relative flex flex-col items-center gap-8 px-6 text-center animate-float-up">
        {/* Logo only — no text, bg removed */}
        <img
          src="/logo.png"
          alt="SplitSmart"
          className="h-64 md:h-72 w-auto mix-blend-normal"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />

        <p className="text-muted-foreground text-lg -mt-4">
          Split expenses. Not friendships.
        </p>

        {/* CTA */}
        <Button
          onClick={() => navigate("/login")}
          size="lg"
          className="bg-gradient-hero hover:opacity-90 text-white font-semibold shadow-lift gap-2 h-12 px-8 rounded-xl"
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-xs text-muted-foreground">
          Built for the way you actually spend money.
        </p>
      </div>
    </div>
  );
}
