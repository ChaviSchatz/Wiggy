import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Presentational chip. Each variant is a soft `-100` ground with the deepened
 * `-600` foreground -- the `-500` mid-tones fail WCAG AA at this text size
 * (design-system.md §1), so they are never used here.
 *
 * Prefer `StatusChip` in components: it owns the domain-status -> variant
 * mapping so callers pass meaning rather than colour.
 */
const badgeVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-meta font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-mauve-100 text-mauve-600",
        success: "bg-sage-100 text-sage-600",
        warning: "bg-peach-100 text-peach-600",
        danger: "bg-danger-100 text-danger-600",
        info: "bg-info-100 text-info-600",
        idle: "bg-idle-100 text-idle-600",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
