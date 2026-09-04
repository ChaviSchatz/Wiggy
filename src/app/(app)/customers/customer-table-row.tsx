"use client";

import { useRouter } from "next/navigation";

import { TableRow } from "@/components/ui/table";

/** Row click opens the detail page; the trailing actions cell stops propagation (screen-designs.md #9). */
export function CustomerTableRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(href)}>
      {children}
    </TableRow>
  );
}
