"use client";

import { useRouter } from "next/navigation";

import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Row click opens the detail page; the trailing actions cell stops propagation (screen-designs.md #9). */
export function CustomerTableRow({
  href,
  highlighted,
  children,
}: {
  href: string;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <TableRow
      className={cn("cursor-pointer", highlighted && "bg-mauve-100")}
      onClick={() => router.push(href)}
    >
      {children}
    </TableRow>
  );
}
