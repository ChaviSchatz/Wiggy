import { useTranslations } from "next-intl";

import { Panel } from "@/components/ui/panel";
import type { ActivityEntry } from "@/lib/activity/queries";
import {
  isMissingItemKind,
  isMissingItemStatus,
} from "@/lib/missing-items/validation";

/**
 * History / activity section, from the unified `activity` stream (ADR
 * 0004) -- a single-column timeline with the actor, the action, and a
 * tabular-nums timestamp (screen-designs.md, Work-order hub).
 */
export function HistorySection({ activity }: { activity: ActivityEntry[] }) {
  const t = useTranslations("pages.orders.detail.hub.history");

  return (
    <Panel title={t("title")}>
      {activity.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ol className="space-y-4">
          {activity.map((entry, index) => (
            <li key={entry.id} className="relative ps-5">
              {index < activity.length - 1 ? (
                <span
                  className="absolute inset-y-0 top-2.5 start-[3px] w-px bg-line"
                  aria-hidden="true"
                />
              ) : null}
              <span
                className="absolute start-0 top-1.5 size-[7px] rounded-full bg-mauve-600"
                aria-hidden="true"
              />
              <p className="text-sm text-ink">
                <ActivityLine entry={entry} />
              </p>
              <p className="text-meta tabular-nums text-muted">
                {entry.actorName ?? t("system")}
                {" · "}
                {new Date(entry.created_at).toLocaleString("he-IL")}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function ActivityLine({ entry }: { entry: ActivityEntry }) {
  const t = useTranslations("pages.orders.detail.hub.history.verbs");
  const tWarnings = useTranslations("pages.orders.detail.hub.warnings");
  const payload = (entry.payload ?? {}) as Record<string, unknown>;

  const kindLabel = (value: unknown) =>
    isMissingItemKind(String(value))
      ? tWarnings(`kind.${value}`)
      : String(value);
  const statusLabel = (value: unknown) =>
    isMissingItemStatus(String(value))
      ? tWarnings(`status.${value}`)
      : String(value);

  switch (entry.verb) {
    case "order_status_changed":
      return (
        <>
          {t("order_status_changed", {
            from: String(payload.from ?? ""),
            to: String(payload.to ?? ""),
          })}
        </>
      );
    case "task_returned_for_rework":
      return (
        <>
          {t("task_returned_for_rework", {
            reason: String(payload.reason ?? ""),
          })}
        </>
      );
    case "task_deferred":
      return (
        <>{t("task_deferred", { reason: String(payload.reason ?? "") })}</>
      );
    case "attachment_added":
      return (
        <>
          {t("attachment_added", { fileName: String(payload.fileName ?? "") })}
        </>
      );
    case "missing_item_created":
      return (
        <>{t("missing_item_created", { kind: kindLabel(payload.kind) })}</>
      );
    case "missing_item_status_changed":
      return (
        <>
          {t("missing_item_status_changed", {
            kind: kindLabel(payload.kind),
            from: statusLabel(payload.from),
            to: statusLabel(payload.to),
          })}
        </>
      );
    default:
      return <>{t(entry.verb, payload as Record<string, string>)}</>;
  }
}
