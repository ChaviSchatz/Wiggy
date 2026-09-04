import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BackLinkProps {
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * RTL points the chevron inline-end — "back" reads toward the start of the
 * line (the right, in Hebrew), which lucide's ChevronRight already draws
 * (design-language.md: direction icons are picked per-direction, not flipped).
 */
export function BackLink({ label, href, onClick, className }: BackLinkProps) {
  const classes = cn(
    "inline-flex items-center gap-1.5 text-body font-semibold text-mauve-600 hover:underline",
    className,
  );
  const content = (
    <>
      <ChevronRight className="size-4" aria-hidden />
      {label}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
