import { Link, useLocation } from "react-router-dom";
import { Sparkles, Home as HomeIcon, Wallet, Settings as SettingsIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const links = [
  { to: "/app", label: "Groups", icon: HomeIcon },
  { to: "/personal", label: "Personal", icon: Wallet },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function TopNav({ right }: { right?: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/75 border-b border-border">
      <div className="container max-w-5xl flex items-center justify-between h-16 gap-4">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:inline">SplitSmart</span>
        </Link>

        <nav className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1">
          {links.map((l) => {
            const active = pathname === l.to || (l.to === "/app" && pathname.startsWith("/group"));
            const Icon = l.icon;
            return (
              <Link key={l.to} to={l.to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
