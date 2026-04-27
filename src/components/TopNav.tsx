import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function TopNav({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/75 border-b border-border">
      <div className="container max-w-5xl flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight">SplitSmart</span>
        </Link>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}
