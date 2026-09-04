import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Squared reference/work thumbnail (design-system.md "core" group):
 * `radius-xs`, `object-cover`, rendered only when an image exists -- no
 * placeholder, no reserved slot. Structurally distinct from `Avatar` so a
 * work photo and a person can never be confused.
 */
export function WorkImage({
  src,
  alt,
  size = 96,
  className,
}: {
  /** Falsy renders nothing at all -- that is the contract. */
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={cn(
        "aspect-square shrink-0 rounded-xs border border-line object-cover",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}
