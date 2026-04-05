import { cn, getTrendLabel } from "@/lib/utils";
import { Flame, TrendingUp } from "lucide-react";

interface TrendBadgeProps {
  score: number;
  className?: string;
}

export function TrendBadge({ score, className }: TrendBadgeProps) {
  const level = getTrendLabel(score);

  if (level === "normal") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
        level === "hot"
          ? "bg-red-500/20 text-red-400 border border-red-500/30"
          : "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        className
      )}
    >
      {level === "hot" ? (
        <Flame className="w-3 h-3" />
      ) : (
        <TrendingUp className="w-3 h-3" />
      )}
      {level === "hot" ? "Hot" : "Rising"}
    </span>
  );
}
