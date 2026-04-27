import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AvatarProps {
  member: Pick<Member, "name" | "color">;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

export function MemberAvatar({ member, size = "md", className }: AvatarProps) {
  const initials = member.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white shrink-0 ring-2 ring-card",
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: `hsl(${member.color})` }}
    >
      {initials || "?"}
    </div>
  );
}

export function MemberStack({ members, max = 4 }: { members: Member[]; max?: number }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m) => (
        <MemberAvatar key={m.id} member={m} size="sm" />
      ))}
      {extra > 0 && (
        <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold flex items-center justify-center ring-2 ring-card">
          +{extra}
        </div>
      )}
    </div>
  );
}
