import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles, LayoutDashboard, Wallet, Receipt, ArrowLeftRight,
  Target, PiggyBank, BarChart3, Settings as SettingsIcon, Plus,
  Bell, Menu, X, Users, ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/lib/useGroups";
import { store } from "@/lib/store";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV: NavItem[] = [
  { to: "/app", label: "Overview", icon: LayoutDashboard },
  { to: "/app?tab=balances", label: "Balances", icon: ArrowLeftRight },
  { to: "/app?tab=expenses", label: "Expenses", icon: Receipt },
  { to: "/app?tab=settlements", label: "Settlements", icon: Wallet },
  { to: "/personal?tab=budgets", label: "Budgets", icon: PiggyBank },
  { to: "/personal?tab=goals", label: "Goals", icon: Target },
  { to: "/personal", label: "Personal", icon: BarChart3, badge: "NEW" },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const groups = useGroups();
  const meName = store.getMeName();
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) => {
    const [path] = to.split("?");
    if (path === pathname) return true;
    if (path === "/app" && pathname.startsWith("/group")) return false;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "fixed lg:sticky inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "h-screen top-0",
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-lg tracking-tight">SplitSmart</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New Group CTA */}
        <div className="px-4">
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full bg-gradient-violet text-white rounded-xl py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-glow hover:opacity-95 transition-all hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> New Group
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to + item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative group",
                  active
                    ? "bg-gradient-card text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-violet" />
                )}
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gradient-coral text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Groups list */}
          <div className="pt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Your Groups
              </span>
              <button
                onClick={() => setCreateOpen(true)}
                className="h-5 w-5 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-0.5">
              {groups.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground italic">No groups yet</p>
              )}
              {groups.slice(0, 8).map((g) => {
                const active = pathname === `/group/${g.id}`;
                return (
                  <Link
                    key={g.id}
                    to={`/group/${g.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group",
                      active
                        ? "bg-gradient-card text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    )}
                  >
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: `hsl(${g.color} / 0.18)` }}
                    >
                      {g.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-[13px]">{g.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {g.members.length} members
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Settings footer */}
        <div className="px-3 py-3 border-t border-sidebar-border">
          <Link
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              pathname === "/settings"
                ? "bg-gradient-card text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            )}
          >
            <SettingsIcon className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="flex items-center justify-between h-16 px-5 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center"
              >
                <Menu className="h-5 w-5" />
              </button>
              {title && (
                <h1 className="text-base font-bold tracking-tight hidden sm:block">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="relative h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              </button>
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-border">
                <div className="h-8 w-8 rounded-full bg-gradient-violet flex items-center justify-center text-white text-xs font-bold shadow-glow">
                  {meName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold">{meName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(g) => navigate(`/group/${g.id}`)}
      />
    </div>
  );
}
