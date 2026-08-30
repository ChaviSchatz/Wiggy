"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import {
  cancelOrderAction,
  markDeliveredAction,
} from "@/lib/work-orders/actions";
import {
  priorityBadgeVariant,
  statusBadgeVariant,
} from "@/lib/work-orders/labels";
import type { HubData } from "@/lib/work-orders/hub-queries";

const FINAL_STATUSES = new Set(["completed", "cancelled"]);

export function HubHeader({
  order,
  canManageOrder,
  onEditIntake,
}: {
  order: HubData["order"];
  canManageOrder: boolean;
  onEditIntake: () => void;
}) {
  const t = useTranslations("pages.orders");
  const th = useTranslations("pages.orders.detail.hub");
  const identity = order.customerName ?? order.template_name ?? "";
  const isFinal = FINAL_STATUSES.has(order.status);

  return (
    <div className="mb-4 space-y-3">
      <Link
        href="/board"
        className="inline-flex items-center gap-1 text-sm text-mauve-600 hover:underline"
      >
        <ArrowRight className="size-4" aria-hidden />
        {th("backToBoard")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{identity}</h1>
          <p className="text-sm text-muted">
            {`#${order.number}`}
            {order.customerName && order.template_name
              ? ` · ${order.template_name}`
              : ""}
            {" · "}
            {new Date(order.order_received_date).toLocaleDateString("he-IL")}
            {order.due_at
              ? ` → ${new Date(order.due_at).toLocaleDateString("he-IL")}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusBadgeVariant(order.status)}>
            {t(`status.${order.status}`)}
          </Badge>
          {order.priority === "urgent" ? (
            <Badge variant={priorityBadgeVariant(order.priority)}>
              {t("priority.urgent")}
            </Badge>
          ) : null}
        </div>
      </div>

      {order.customerPhone || order.customerEmail ? (
        <div className="flex flex-wrap gap-2">
          {order.customerPhone ? (
            <>
              <ContactLink
                href={`tel:${order.customerPhone}`}
                icon={Phone}
                label={th("call")}
              />
              <ContactLink
                href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, "")}`}
                icon={MessageCircle}
                label={th("whatsapp")}
              />
            </>
          ) : null}
          {order.customerEmail ? (
            <ContactLink
              href={`mailto:${order.customerEmail}`}
              icon={Mail}
              label={th("email")}
            />
          ) : null}
        </div>
      ) : null}

      {canManageOrder ? (
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <Button size="sm" variant="outline" onClick={onEditIntake}>
            {th("editIntake.button")}
          </Button>
          {order.status === "ready_for_handoff" ? (
            <MarkDeliveredDialog workOrderId={order.id} />
          ) : null}
          {!isFinal ? <CancelOrderDialog workOrderId={order.id} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function ContactLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Phone;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:bg-mauve-100"
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </a>
  );
}

function MarkDeliveredDialog({ workOrderId }: { workOrderId: string }) {
  const th = useTranslations("pages.orders.detail.hub");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleConfirm() {
    startTransition(async () => {
      const result = await markDeliveredAction(workOrderId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {th("markDelivered")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{th("markDeliveredTitle")}</DialogTitle>
          <DialogDescription>{th("markDeliveredConfirm")}</DialogDescription>
        </DialogHeader>
        {error ? (
          <FormMessage variant="error">{th("genericError")}</FormMessage>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {th("cancelAction")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={pending}>
            {th("confirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelOrderDialog({ workOrderId }: { workOrderId: string }) {
  const th = useTranslations("pages.orders.detail.hub");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleConfirm() {
    startTransition(async () => {
      const result = await cancelOrderAction(workOrderId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {th("cancelOrder")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{th("cancelOrderTitle")}</DialogTitle>
          <DialogDescription>{th("cancelOrderConfirm")}</DialogDescription>
        </DialogHeader>
        {error ? (
          <FormMessage variant="error">{th("genericError")}</FormMessage>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {th("cancelAction")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={pending}
          >
            {th("confirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
