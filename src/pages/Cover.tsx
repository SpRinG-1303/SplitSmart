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
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo.png"
            alt="SplitSmart"
            className="h-40 w-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight gradient-text">
              SplitSmart
            </h1>
            <p className="mt-2 text-muted-foreground text-lg">
              Split expenses. Not friendships.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            onClick={() => navigate("/login")}
            size="lg"
            className="bg-gradient-hero hover:opacity-90 text-white font-semibold shadow-lift gap-2 h-12 px-8 rounded-xl"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Built for the way you actually spend money.
        </p>
      </div>
    </div>
  );
}
