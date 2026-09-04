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
 *
 * `emphasis` spends the view's one-accent-per-view budget on the single most
 * operationally important metric: a 2px plum border plus a plum-soft eyebrow
 * chip above the label (design-system.md §4, KpiCard). At most one per view.
 */
export function KpiCard({
  label,
  value,
  hint,
  eyebrow,
  icon: Icon,
  tone = "neutral",
  emphasis = false,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  /** Required when `emphasis` is set -- the plum-soft chip text. */
  eyebrow?: string;
  icon?: LucideIcon;
  tone?: KpiTone;
  emphasis?: boolean;
  href?: string;
}) {
  const content = (
    <Card
      className={cn(
        "h-full p-4",
        href && "hover:border-mauve-600/40 transition-colors",
        emphasis && "border-2 border-mauve-600/34",
      )}
    >
      {emphasis && eyebrow ? (
        <span className="mb-2 inline-flex items-center rounded-full border border-mauve-200 bg-mauve-100 px-2 py-0.5 text-meta font-medium text-mauve-600">
          {eyebrow}
        </span>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <p className="text-label text-muted">{label}</p>
        {Icon ? (
          <Icon
            className={cn("size-5 shrink-0", TONE_CLASS[tone])}
            aria-hidden
          />
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-metric tabular-nums",
          TONE_CLASS[tone],
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-meta text-muted">{hint}</p> : null}
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
