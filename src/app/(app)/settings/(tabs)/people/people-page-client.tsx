"use client";

import Link from "next/link";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailPanel } from "@/components/ui/detail-panel";
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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
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
                <TableHead>{t("columns.bookable")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="text-end">
                  {t("columns.actions")}
                </TableHead>
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
                      isHighlighted && "bg-mauve-100",
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
                      <span className="text-meta text-muted">
                        {person.is_bookable
                          ? t("bookable.yes")
                          : t("bookable.no")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={person.is_active ? "success" : "idle"}>
                        {person.is_active
                          ? t("status.active")
                          : t("status.inactive")}
                      </Badge>
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
        <DetailPanel
          leading={
            panel.kind === "create" ? (
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-mauve-100 text-mauve-600">
                <UserPlus className="size-5" aria-hidden />
              </span>
            ) : (
              <Avatar
                name={panel.person.full_name}
                size="lg"
                className="shrink-0"
              />
            )
          }
          title={panelTitle()}
          subtitle={
            panel.kind !== "create" ? panel.person.full_name : undefined
          }
          closeLabel={t("form.close")}
          onClose={close}
        >
          {panel.kind === "create" || panel.kind === "edit" ? (
            <PersonPanel
              key={panel.kind === "edit" ? panel.person.id : "create"}
              stages={stages}
              person={panel.kind === "edit" ? panel.person : undefined}
              canManageAccess={canManageAccess}
              onDone={close}
            />
          ) : (
            <AccessPanel
              kind={panel.kind}
              person={panel.person}
              onDone={close}
            />
          )}
        </DetailPanel>
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
