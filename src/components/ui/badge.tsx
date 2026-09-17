import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Presentational chip. Each `variant` is a soft `-100` ground with the
 * deepened `-600` foreground -- the `-500` mid-tones fail WCAG AA at this
 * text size (design-system.md §1), so they are never used here.
 *
 * `quiet` drops the ground entirely (dot + word only, `-600` text on
 * transparent) for dense surfaces -- a board column of a dozen cards where a
 * filled chip on every row would stop meaning "look here" (design-system
 * §12). It never changes which colour is used, only whether it has a
 * background.
 *
 * Prefer `StatusChip` in components: it owns the domain-status -> variant
 * mapping so callers pass meaning rather than colour.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap text-meta font-medium",
  {
    variants: {
      variant: {
        neutral: "text-mauve-600",
        success: "text-sage-600",
        warning: "text-peach-600",
        danger: "text-danger-600",
        info: "text-info-600",
        idle: "text-idle-600",
      },
      quiet: {
        true: "",
        false: "rounded-full px-2.5 py-0.5",
      },
    },
    compoundVariants: [
      { variant: "neutral", quiet: false, class: "bg-mauve-100" },
      { variant: "success", quiet: false, class: "bg-sage-100" },
      { variant: "warning", quiet: false, class: "bg-peach-100" },
      { variant: "danger", quiet: false, class: "bg-danger-100" },
      { variant: "info", quiet: false, class: "bg-info-100" },
      { variant: "idle", quiet: false, class: "bg-idle-100" },
    ],
    defaultVariants: { variant: "neutral", quiet: false },
  },
);

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;

export function Badge({
  className,
  variant,
  quiet,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={cn(badgeVariants({ variant, quiet }), className)}
      {...props}
    />
  );
}
