"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  derivePersonAccessState,
  type PersonAccessState,
} from "@/lib/people/guards";
import type { PersonListItem } from "@/lib/people/queries";
import { cn } from "@/lib/utils";
import { AccessPanel } from "./access-panels";
import { PersonPanel } from "./person-panel";
import { PersonRowActions } from "./person-row-actions";

export type StageOption = { id: string; name: string };

export type PanelState =
  | { kind: "create" }
  | { kind: "edit"; person: PersonListItem }
  | { kind: "invite"; person: PersonListItem }
  | { kind: "correctEmail"; person: PersonListItem }
  | { kind: "changeRole"; person: PersonListItem };

export function PeoplePageClient({
  people,
  stages,
  openTaskCounts,
  lastSignIns,
  canManageAccess,
  showInactive,
}: {
  people: PersonListItem[];
  stages: StageOption[];
  openTaskCounts: Record<string, number>;
  lastSignIns: Record<string, string | null>;
  canManageAccess: boolean;
  showInactive: boolean;
}) {
  const t = useTranslations("pages.settings.people");
  const [panel, setPanel] = useState<PanelState | null>(null);

  function close() {
    setPanel(null);
  }

  function accessStateFor(person: PersonListItem): PersonAccessState {
    return derivePersonAccessState(
      person.user_id,
      person.user_id ? (lastSignIns[person.user_id] ?? null) : null,
    );
  }

  function panelTitle() {
    if (!panel) return "";
    switch (panel.kind) {
      case "create":
        return t("form.createTitle");
      case "edit":
        return t("form.editTitle");
      case "invite":
        return t("invite.title");
      case "correctEmail":
        return t("correctEmail.title");
      case "changeRole":
        return t("changeRole.title");
    }
  }

  return (
    <div className="flex items-start gap-6">
      {/* Table — shrinks naturally as the panel opens */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setPanel({ kind: "create" })}
          >
            + {t("add")}
          </Button>
          <Link
            href={
              showInactive
                ? "/settings/people"
                : "/settings/people?inactive=1"
            }
            className="text-body text-muted underline-offset-4 hover:underline"
          >
            {showInactive ? t("hideInactive") : t("showInactive")}
          </Link>
        </div>

        {people.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.name")}</TableHead>
                <TableHead>{t("columns.title")}</TableHead>
                <TableHead>{t("columns.stage")}</TableHead>
                <TableHead>{t("columns.access")}</TableHead>
                <TableHead>{t("columns.assignable")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => {
                const accessState = accessStateFor(person);
                const isHighlighted =
                  panel &&
                  panel.kind !== "create" &&
                  panel.person.id === person.id;
                return (
                  <TableRow
                    key={person.id}
                    className={cn(
                      person.is_active ? undefined : "opacity-60",
                      isHighlighted && "bg-fill-subtle",
                    )}
                  >
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <Avatar name={person.full_name} size="sm" />
                        <span>
                          {person.full_name}
                          {person.linkedEmail ? (
                            <span
                              className="block text-meta text-muted"
                              dir="ltr"
                            >
                              {person.linkedEmail}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{person.title ?? t("none")}</TableCell>
                    <TableCell>{person.workStageName ?? t("none")}</TableCell>
                    <TableCell>
                      <AccessBadges
                        person={person}
                        accessState={accessState}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-meta text-muted">
                        {person.is_assignable
                          ? t("assignable.yes")
                          : t("assignable.no")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {person.is_active
                        ? t("status.active")
                        : t("status.inactive")}
                    </TableCell>
                    <TableCell>
                      <PersonRowActions
                        person={person}
                        openTaskCount={openTaskCounts[person.id] ?? 0}
                        accessState={accessState}
                        canManageAccess={canManageAccess}
                        onOpenPanel={setPanel}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Inline detail panel — part of the page flow, no overlay */}
      {panel ? (
        <div className="w-[360px] shrink-0 rounded-xl border border-line bg-surface shadow-sm flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <p className="font-semibold text-ink leading-snug">
                {panelTitle()}
              </p>
              {panel.kind !== "create" ? (
                <p className="text-meta text-muted mt-0.5 truncate">
                  {panel.person.full_name}
                </p>
              ) : null}
            </div>
            <button
              onClick={close}
              className="mt-0.5 shrink-0 rounded-control p-1 text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="סגור"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          {/* Panel body */}
          {panel.kind === "create" || panel.kind === "edit" ? (
            <PersonPanel
              stages={stages}
              person={panel.kind === "edit" ? panel.person : undefined}
              canManageAccess={canManageAccess}
              onDone={close}
            />
          ) : (
            <AccessPanel kind={panel.kind} person={panel.person} onDone={close} />
          )}
        </div>
      ) : null}
    </div>
  );
}

function AccessBadges({
  person,
  accessState,
}: {
  person: PersonListItem;
  accessState: PersonAccessState;
}) {
  const t = useTranslations("pages.settings.people");

  if (accessState === "rosterOnly") {
    return <Badge variant="idle">{t("access.noLogin")}</Badge>;
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {person.role ? (
        <Badge variant="neutral">{t(`roles.${person.role}`)}</Badge>
      ) : null}
      {accessState === "invited" ? (
        <Badge variant="warning">{t("access.invited")}</Badge>
      ) : null}
      {!person.membershipActive ? (
        <Badge variant="idle">{t("access.revoked")}</Badge>
      ) : null}
    </span>
  );
}
