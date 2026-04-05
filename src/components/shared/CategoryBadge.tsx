import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  nameEn: string;
  nameFr: string;
  color?: string | null;
  locale: string;
  className?: string;
}

export function CategoryBadge({ nameEn, nameFr, color, locale, className }: CategoryBadgeProps) {
  const name = locale === "fr" ? nameFr : nameEn;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        className
      )}
      style={color ? { borderColor: `${color}40`, color, backgroundColor: `${color}15` } : undefined}
    >
      {name}
    </span>
  );
}
