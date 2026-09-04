"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
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
import { IconButton } from "@/components/ui/icon-button";
import { StatusChip } from "@/components/domain/status-chip";
import {
  cancelOrderAction,
  markDeliveredAction,
} from "@/lib/work-orders/actions";
import type { HubData } from "@/lib/work-orders/hub-queries";

const FINAL_STATUSES = new Set(["completed", "cancelled"]);

export function HubHeader({
  order,
}: {
  order: HubData["order"];
}) {
  const t = useTranslations("pages.orders");
  const th = useTranslations("pages.orders.detail.hub");
  const identity = order.customerName ?? order.template_name ?? "";

  const subtitle = [
    `#${order.number}`,
    order.customerName && order.template_name ? order.template_name : null,
    new Date(order.order_received_date).toLocaleDateString("he-IL") +
      (order.due_at
        ? ` → ${new Date(order.due_at).toLocaleDateString("he-IL")}`
        : ""),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mb-4 space-y-3">
      <BackLink href="/board" label={th("backToBoard")} />

      <PageHeader
        title={identity}
        subtitle={subtitle}
        actions={
          <>
            <StatusChip
              kind="order"
              status={order.status}
              label={t(`status.${order.status}`)}
            />
            <StatusChip
              kind="urgency"
              status={order.priority}
              label={t("priority.urgent")}
            />
            {order.customerPhone ? (
              <>
                <IconButton
                  href={`tel:${order.customerPhone}`}
                  icon={<Phone className="size-4" aria-hidden />}
                  label={th("call")}
                />
                <IconButton
                  href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  icon={<MessageCircle className="size-4" aria-hidden />}
                  label={th("whatsapp")}
                />
              </>
            ) : null}
            {order.customerEmail ? (
              <IconButton
                href={`mailto:${order.customerEmail}`}
                icon={<Mail className="size-4" aria-hidden />}
                label={th("email")}
              />
            ) : null}
          </>
        }
      />
    </div>
  );
}

/** Order-level actions live in the hub's `PrimaryActionBar` footer, not the header. */
export function EditIntakeButton({ onClick }: { onClick: () => void }) {
  const th = useTranslations("pages.orders.detail.hub");
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      {th("editIntake.button")}
    </Button>
  );
}

export function isOrderFinal(status: string) {
  return FINAL_STATUSES.has(status);
}

export function MarkDeliveredDialog({ workOrderId }: { workOrderId: string }) {
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

export function CancelOrderDialog({ workOrderId }: { workOrderId: string }) {
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
