"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Calm, stable monogram grounds. Deliberately excludes `danger`, so a worker's
 * initials can never be mistaken for an alert.
 */
const MONOGRAM_COLORS = [
  "bg-mauve-100 text-mauve-600",
  "bg-sage-100 text-sage-600",
  "bg-info-100 text-info-600",
  "bg-peach-100 text-peach-600",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[parts.length - 1][0]}`;
}

const DIMENSIONS = {
  sm: "size-7 text-meta",
  md: "size-[34px] text-body",
  lg: "size-11 text-body-lg",
} as const;

/**
 * Circular worker avatar (design-language.md "Identity & media rules"):
 * workers always render an avatar, a photo when one exists and a monogram
 * fallback (stable colour) otherwise. Never used for client identity, which
 * is text-only.
 *
 * The light ring is what lets the same avatar read cleanly on white content
 * and on the dark side navigation.
 */
export function Avatar({
  name,
  src,
  size = "md",
  onClick,
  className,
}: {
  /** `null` renders the unassigned state (dashed ring, no monogram/photo). */
  name: string | null;
  /** Falls back to the monogram when omitted, or if the image fails to load. */
  src?: string;
  size?: keyof typeof DIMENSIONS;
  /** Board cards use this to open the reassignment picker. */
  onClick?: () => void;
  className?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const dimension = DIMENSIONS[size];
  const interactive = Boolean(onClick);
  const Tag = interactive ? "button" : "span";
  const interactiveProps = interactive
    ? { type: "button" as const, onClick }
    : {};

  if (!name) {
    return (
      <Tag
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line-strong text-muted",
          interactive &&
            "cursor-pointer transition-colors hover:border-mauve-600 hover:text-mauve-600",
          dimension,
          className,
        )}
        aria-hidden={!interactive}
        {...interactiveProps}
      />
    );
  }

  if (src && !imgFailed) {
    return (
      <Tag
        className={cn(
          "inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-inset ring-white/70",
          interactive && "cursor-pointer",
          dimension,
          className,
        )}
        title={name}
        {...interactiveProps}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- worker
            photos are arbitrary external/storage URLs, not build-time assets. */}
        <img
          src={src}
          alt={name}
          className="size-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </Tag>
    );
  }

  return (
    <Tag
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-white/70",
        colorForName(name),
        interactive && "cursor-pointer",
        dimension,
        className,
      )}
      title={name}
      {...interactiveProps}
    >
      {initials(name)}
    </Tag>
  );
}
