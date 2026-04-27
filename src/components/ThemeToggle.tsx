import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(
        "relative h-9 w-9 rounded-xl border border-border bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-all overflow-hidden group",
        className,
      )}
    >
      <Sun className={cn("h-4 w-4 absolute transition-all", theme === "dark" ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100")} />
      <Moon className={cn("h-4 w-4 absolute transition-all", theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50")} />
    </button>
  );
}
