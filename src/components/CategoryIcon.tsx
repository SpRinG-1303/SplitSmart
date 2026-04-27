import { CATEGORY_META, type Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  category: Category;
  size?: "sm" | "md" | "lg";
  className?: string;
  withRing?: boolean;
}

const sizes = {
  sm: "h-8 w-8 text-base",
  md: "h-11 w-11 text-xl",
  lg: "h-14 w-14 text-2xl",
};

export function CategoryIcon({ category, size = "md", className, withRing }: Props) {
  const meta = CATEGORY_META[category];
  return (
    <div
      className={cn(
        "rounded-2xl flex items-center justify-center shrink-0 transition-all",
        sizes[size],
        withRing && "ring-1 ring-border",
        className,
      )}
      style={{
        backgroundColor: `hsl(var(--cat-${category.toLowerCase()}) / 0.14)`,
      }}
      title={category}
    >
      <span>{meta.emoji}</span>
    </div>
  );
}
