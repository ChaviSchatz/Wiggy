import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type KpiTone = "neutral" | "warning" | "danger";

const TONE_CLASS: Record<KpiTone, string> = {
  neutral: "text-ink",
  warning: "text-peach-500",
  danger: "text-danger-600",
};

/**
 * One number on the Dashboard archetype (docs/ui/design-system.md §F:
 * "KpiCard grid + widget lists"). The whole card is the link target when a
 * `href` is given, so the tap area is the card rather than a small label.
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: KpiTone;
  href?: string;
}) {
  const content = (
    <Card
      className={cn(
        "h-full p-4",
        href && "transition-colors hover:border-mauve-600/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {Icon ? (
          <Icon className={cn("size-5 shrink-0", TONE_CLASS[tone])} aria-hidden />
        ) : null}
      </div>
      <p className={cn("mt-2 text-3xl font-bold tabular-nums", TONE_CLASS[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  );
}
