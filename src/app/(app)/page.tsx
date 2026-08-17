import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  PackageX,
  PauseCircle,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/domain/kpi-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/server";
import {
  fetchOfficeDashboard,
  fetchWorkerDashboard,
  type OfficeDashboard,
  type WorkerDashboard,
} from "@/lib/dashboard/queries";
import { can, type Role } from "@/lib/roles";
import { fetchStaffMemberIdForUser } from "@/lib/sprints/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

/**
 * Dashboard / home (screen inventory #7), role-tailored per
 * docs/ui/information-architecture.md. Office roles get the salon-wide command
 * centre; a worker gets their own workload and a way into My Work (which is
 * where they land on login anyway).
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseClient();
  const showsOfficeDashboard = can(user.role, "createOrders");

  if (!showsOfficeDashboard) {
    const staffMemberId = await fetchStaffMemberIdForUser(
      supabase,
      user.businessId,
      user.id,
    );
    const data = await fetchWorkerDashboard(
      supabase,
      user.businessId,
      staffMemberId,
    );
    return <WorkerDashboardView data={data} />;
  }

  const data = await fetchOfficeDashboard(supabase, user.businessId);
  return <OfficeDashboardView data={data} role={user.role} />;
}

function OfficeDashboardView({
  data,
  role,
}: {
  data: OfficeDashboard;
  role: Role;
}) {
  const t = useTranslations("pages.dashboard");
  const tMissing = useTranslations("pages.missingItems");
  // A secretary runs intake, not the production plan: no sprint/approval KPIs.
  const showsProductionPlan = can(role, "planSprint");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label={t("kpis.activeOrders")}
          value={data.activeOrders}
          icon={ClipboardList}
          href="/orders"
        />
        <KpiCard
          label={t("kpis.urgent")}
          value={data.urgentOrders}
          icon={AlertTriangle}
          tone={data.urgentOrders > 0 ? "danger" : "neutral"}
          href="/orders"
        />
        <KpiCard
          label={t("kpis.dueSoon")}
          value={data.dueSoonOrders}
          hint={t("kpis.dueSoonHint")}
          icon={CalendarClock}
          tone={data.dueSoonOrders > 0 ? "warning" : "neutral"}
          href="/orders"
        />
        <KpiCard
          label={t("kpis.missingItems")}
          value={data.openMissingItems}
          icon={PackageX}
          tone={data.openMissingItems > 0 ? "warning" : "neutral"}
          href="/missing-items"
        />
        {showsProductionPlan ? (
          <KpiCard
            label={t("kpis.awaitingApproval")}
            value={data.awaitingApproval}
            icon={CheckCircle2}
            tone={data.awaitingApproval > 0 ? "warning" : "neutral"}
            href="/approvals"
          />
        ) : null}
      </div>

      {showsProductionPlan ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/sprint"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("quickActions.sprint")}
          </Link>
          <Link
            href="/board"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("quickActions.board")}
          </Link>
          <Link href="/orders/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="size-4" aria-hidden />
            {t("quickActions.newOrder")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Link href="/orders/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="size-4" aria-hidden />
            {t("quickActions.newOrder")}
          </Link>
          <Link
            href="/customers"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("quickActions.customers")}
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("attention.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.attention.missingItems.length === 0 &&
            data.attention.approvals.length === 0 &&
            data.attention.deferred.length === 0 ? (
              <p className="text-sm text-muted">{t("attention.empty")}</p>
            ) : null}

            {data.attention.missingItems.length > 0 ? (
              <AttentionGroup
                icon={PackageX}
                title={t("attention.missingItems")}
                href="/missing-items"
                hrefLabel={t("attention.viewAll")}
              >
                {data.attention.missingItems.map((item) => (
                  <AttentionRow
                    key={item.id}
                    href={`/orders/${item.work_order_id}`}
                    title={tMissing(`kind.${item.kind}`)}
                    subtitle={t("attention.orderLine", {
                      number: item.orderNumber,
                      customer: item.customerName ?? tMissing("noCustomer"),
                    })}
                  />
                ))}
              </AttentionGroup>
            ) : null}

            {showsProductionPlan && data.attention.approvals.length > 0 ? (
              <AttentionGroup
                icon={CheckCircle2}
                title={t("attention.approvals")}
                href="/approvals"
                hrefLabel={t("attention.viewAll")}
              >
                {data.attention.approvals.map((task) => (
                  <AttentionRow
                    key={task.id}
                    href={`/orders/${task.workOrderId}`}
                    title={task.title}
                    subtitle={t("attention.orderLine", {
                      number: task.orderNumber,
                      customer: task.customerName ?? tMissing("noCustomer"),
                    })}
                  />
                ))}
              </AttentionGroup>
            ) : null}

            {data.attention.deferred.length > 0 ? (
              <AttentionGroup
                icon={PauseCircle}
                title={t("attention.deferred")}
                href="/board"
                hrefLabel={t("attention.viewAll")}
              >
                {data.attention.deferred.map((task) => (
                  <AttentionRow
                    key={task.id}
                    href={`/orders/${task.workOrderId}`}
                    title={task.title}
                    subtitle={t("attention.orderLine", {
                      number: task.orderNumber,
                      customer: task.customerName ?? tMissing("noCustomer"),
                    })}
                  />
                ))}
              </AttentionGroup>
            ) : null}
          </CardContent>
        </Card>

        {showsProductionPlan ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("sprint.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.sprint ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink">
                    {data.sprint.name ??
                      t("sprint.dateRange", {
                        from: formatDate(data.sprint.startsOn),
                        to: formatDate(data.sprint.endsOn),
                      })}
                  </p>
                  <p className="text-sm text-muted">
                    {t("sprint.progress", {
                      done: data.sprint.done,
                      total: data.sprint.total,
                    })}
                  </p>
                  <SprintProgressBar
                    done={data.sprint.done}
                    total={data.sprint.total}
                  />
                  <Link
                    href="/sprint"
                    className="inline-block text-sm text-mauve-600 hover:underline"
                  >
                    {t("sprint.plan")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted">{t("sprint.none")}</p>
                  <Link
                    href="/sprint"
                    className="inline-block text-sm text-mauve-600 hover:underline"
                  >
                    {t("sprint.plan")}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function WorkerDashboardView({ data }: { data: WorkerDashboard }) {
  const t = useTranslations("pages.dashboard");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("workerSubtitle")} />

      {data.staffMemberId === null ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted">{t("noStaffLink")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label={t("kpis.myInProgress")}
              value={data.inProgress.length}
              icon={ListChecks}
              href="/my-work"
            />
            <KpiCard
              label={t("kpis.myQueue")}
              value={data.queued}
              icon={ClipboardList}
              href="/my-work"
            />
            <KpiCard
              label={t("kpis.myCompletedToday")}
              value={data.completedToday}
              icon={CheckCircle2}
              href="/my-work"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("worker.currentTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.inProgress.length === 0 ? (
                <p className="text-sm text-muted">{t("worker.currentEmpty")}</p>
              ) : (
                <ul className="space-y-2">
                  {data.inProgress.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/orders/${task.workOrderId}`}
                        className="text-sm text-ink hover:underline"
                      >
                        {task.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/my-work"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                {t("worker.openQueue")}
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function AttentionGroup({
  icon: Icon,
  title,
  href,
  hrefLabel,
  children,
}: {
  icon: typeof PackageX;
  title: string;
  href: string;
  hrefLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
          <Icon className="size-4 text-muted" aria-hidden />
          {title}
        </h3>
        <Link href={href} className="text-xs text-mauve-600 hover:underline">
          {hrefLabel}
        </Link>
      </div>
      <ul className="space-y-1">{children}</ul>
    </section>
  );
}

function AttentionRow({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex flex-wrap items-baseline gap-x-2 text-sm hover:underline"
      >
        <span className="text-ink">{title}</span>
        <span className="text-xs text-muted">{subtitle}</span>
      </Link>
    </li>
  );
}

function SprintProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-mauve-100"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-mauve-600"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("he-IL");
}
