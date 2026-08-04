import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { getCurrentUser } from "@/lib/auth/server";
import { can } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  priorityBadgeVariant,
  statusBadgeVariant,
} from "@/lib/work-orders/labels";
import {
  getWorkOrderWithTasks,
  type WorkOrderWithTasks,
} from "@/lib/work-orders/queries";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!can(user.role, "createOrders")) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  const order = await getWorkOrderWithTasks(supabase, params.id);
  if (!order) {
    notFound();
  }

  return <OrderDetailView order={order} />;
}

function OrderDetailView({ order }: { order: WorkOrderWithTasks }) {
  const t = useTranslations("pages.orders");
  const tKind = useTranslations("pages.orders.kind");
  const tTaskStatus = useTranslations("pages.orders.taskStatus");

  const identity = order.customerName ?? tKind(order.work_order_kind);

  return (
    <div>
      <Link
        href="/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm text-mauve-600 hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        {t("backToList")}
      </Link>

      <PageHeader
        title={`#${order.number} · ${identity}`}
        subtitle={order.templateName ?? undefined}
      />

      <FormMessage variant="success">{t("detail.generatedNotice")}</FormMessage>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.infoTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label={t("columns.status")}>
              <Badge variant={statusBadgeVariant(order.status)}>
                {t(`status.${order.status}`)}
              </Badge>
            </DetailRow>
            <DetailRow label={t("columns.priority")}>
              <Badge variant={priorityBadgeVariant(order.priority)}>
                {t(`priority.${order.priority}`)}
              </Badge>
            </DetailRow>
            <DetailRow label={t("columns.receivedDate")}>
              {order.order_received_date}
            </DetailRow>
            <DetailRow label={t("detail.dueAt")}>
              {order.due_at
                ? new Date(order.due_at).toLocaleDateString("he-IL")
                : "—"}
            </DetailRow>
            <DetailRow label={t("detail.notes")}>
              {order.notes ?? "—"}
            </DetailRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("detail.tasksTitle", { count: order.tasks.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.tasks.length === 0 ? (
              <p className="text-sm text-muted">{t("detail.noTasks")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {order.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-ink">{task.title}</p>
                      <p className="text-muted">{task.workStageName}</p>
                    </div>
                    <Badge variant="neutral">{tTaskStatus(task.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  );
}
