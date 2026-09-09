import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form-message";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listTenants } from "@/lib/platform-admin/queries";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PlatformTenantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("platformAdmin.list");
  const tenants = await listTenants();

  const created = firstParam(searchParams.created);
  const showSuccessBanner = !!created;

  return (
    <div className="space-y-4">
      {showSuccessBanner ? (
        <FormMessage variant="success">
          {t("createdMessage", { slug: created })}
        </FormMessage>
      ) : null}
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
