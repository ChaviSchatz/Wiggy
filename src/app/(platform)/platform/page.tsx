import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listTenants } from "@/lib/platform-admin/queries";

export default async function PlatformTenantsPage() {
  const t = await getTranslations("platformAdmin.list");
  const tenants = await listTenants();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-section text-ink">{t("title")}</h1>
        <Button asChild>
          <Link href="/platform/new">{t("newTenant")}</Link>
        </Button>
      </div>

      {tenants.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.slug")}</TableHead>
              <TableHead>{t("columns.timezone")}</TableHead>
              <TableHead>{t("columns.members")}</TableHead>
              <TableHead>{t("columns.created")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>{tenant.name}</TableCell>
                <TableCell>{tenant.slug ?? t("noSlug")}</TableCell>
                <TableCell>{tenant.timezone}</TableCell>
                <TableCell>{tenant.memberCount}</TableCell>
                <TableCell>
                  {new Date(tenant.createdAt).toLocaleDateString("he-IL")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
