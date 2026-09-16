"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelAppointmentAction,
  completeAppointmentAction,
  createAppointmentAction,
  listWorkOrdersForCustomerAction,
  markNoShowAction,
} from "@/lib/appointments/actions";
import type { AppointmentListItem } from "@/lib/appointments/types";
import { searchCustomersAction } from "./search-customers-action";

type CustomerOption = { id: string; name: string; phone: string | null };
type AppointmentTypeOption = {
  id: string;
  name: string;
  defaultDurationMinutes: number | null;
  color: string | null;
};

/**
 * Three modes, deliberately three distinct shapes rather than one loose
 * "create | edit" shape sharing every field: `edit` here only ever means
 * "change this appointment's status" (`AppointmentEditableDetail` below,
 * which reads only `appointment`) -- there is no reschedule-by-dragging
 * form in this task -- so it needs none of `create`'s booking-form fields.
 */
export function AppointmentPopoverContent(
  props:
    | {
        mode: "create";
        /** `null` means "not yet chosen" -- pass `staffOptions` too, and the
         * form renders a required picker instead of booking a predetermined
         * staff member (the team-week entry point, where a shared day
         * column has no single obvious staff member). */
        staffMemberId: string | null;
        /** A real UTC instant (Step 1's `businessWallClockToUtc`), never a naive local string. */
        initialStartsAtUtc: string;
        /** Needed to render the live start–end time range (`TimeRange`) in the business's own timezone. */
        timezone: string;
        customerOptions: CustomerOption[];
        appointmentTypeOptions: AppointmentTypeOption[];
        /** Only needed/passed when `staffMemberId` is `null`. */
        staffOptions?: { id: string; fullName: string }[];
        onDone: () => void;
      }
    | {
        mode: "edit";
        appointment: AppointmentListItem;
        timezone: string;
        onDone: () => void;
      }
    | {
        mode: "view";
        appointment: AppointmentListItem;
        timezone: string;
        onDone: () => void;
      },
) {
  if (props.mode === "view") {
    return (
      <AppointmentViewOnly
        appointment={props.appointment}
        timezone={props.timezone}
        onDone={props.onDone}
      />
    );
  }
  if (props.mode === "edit") {
    return (
      <AppointmentEditableDetail
        appointment={props.appointment}
        timezone={props.timezone}
        onDone={props.onDone}
      />
    );
  }
  return (
    <BookAppointmentForm
      staffMemberId={props.staffMemberId}
      initialStartsAtUtc={props.initialStartsAtUtc}
      timezone={props.timezone}
      customerOptions={props.customerOptions}
      appointmentTypeOptions={props.appointmentTypeOptions}
      staffOptions={props.staffOptions}
      onDone={props.onDone}
    />
  );
}

/** Renders a start–end time range in the business's own timezone, wrapped `dir="ltr"` so the dash-separated pair doesn't visually reverse inside an RTL (Hebrew) layout. */
function TimeRange({
  startsAt,
  endsAt,
  timezone,
}: {
  startsAt: string;
  endsAt: string;
  timezone: string;
}) {
  const format = (iso: string) =>
    new Date(iso).toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    });
  return (
    <span dir="ltr" className="inline-block">
      {format(startsAt)} – {format(endsAt)}
    </span>
  );
}

function AppointmentViewOnly({
  appointment,
  timezone,
  onDone,
}: {
  appointment: AppointmentListItem;
  timezone: string;
  onDone: () => void;
}) {
  const t = useTranslations("pages.calendar.popover");
  return (
    <div className="w-72 space-y-2">
      <p className="text-body font-medium text-ink">{appointment.appointmentTypeName}</p>
      <p className="text-meta text-muted">{appointment.customerName}</p>
      <p className="text-meta text-muted">
        <TimeRange
          startsAt={appointment.starts_at}
          endsAt={appointment.ends_at}
          timezone={timezone}
        />
      </p>
      {appointment.notes ? <p className="text-meta text-ink">{appointment.notes}</p> : null}
      <Button size="sm" variant="outline" onClick={onDone}>
        {t("close")}
      </Button>
    </div>
  );
}

function AppointmentEditableDetail({
  appointment,
  timezone,
  onDone,
}: {
  appointment: AppointmentListItem;
  timezone: string;
  onDone: () => void;
}) {
  const t = useTranslations("pages.calendar.popover");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function run(action: () => ReturnType<typeof completeAppointmentAction>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error);
        return;
      }
      onDone();
      router.refresh();
    });
  }

  return (
    <div className="w-72 space-y-3">
      <p className="text-body font-medium text-ink">{appointment.appointmentTypeName}</p>
      <p className="text-meta text-muted">{appointment.customerName}</p>
      <p className="text-meta text-muted">
        {new Date(appointment.starts_at).toLocaleString("he-IL", {
          timeZone: timezone,
        })}
      </p>
      {error ? <FormMessage variant="error">{t(`errors.${error}`)}</FormMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(() => completeAppointmentAction(appointment.id))}>
          {t("markCompleted")}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => markNoShowAction(appointment.id))}>
          {t("markNoShow")}
        </Button>
        <Button size="sm" variant="danger-soft" disabled={pending} onClick={() => run(() => cancelAppointmentAction(appointment.id))}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}

function BookAppointmentForm({
  staffMemberId,
  initialStartsAtUtc,
  timezone,
  customerOptions,
  appointmentTypeOptions,
  staffOptions,
  onDone,
}: {
  staffMemberId: string | null;
  initialStartsAtUtc: string;
  timezone: string;
  customerOptions: CustomerOption[];
  appointmentTypeOptions: AppointmentTypeOption[];
  /** Only provided at the team-week entry point -- renders a required staff
   * picker instead of booking a predetermined staff member. The
   * single-staff entry point never passes this, so no dropdown renders
   * there and that flow is unchanged. */
  staffOptions?: { id: string; fullName: string }[];
  onDone: () => void;
}) {
  const t = useTranslations("pages.calendar.popover");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerOption[]>(customerOptions);
  const [customerId, setCustomerId] = useState("");
  const [selectedStaffMemberId, setSelectedStaffMemberId] = useState(staffMemberId ?? "");
  const [typeId, setTypeId] = useState(appointmentTypeOptions[0]?.id ?? "");
  const [durationMinutes, setDurationMinutes] = useState<number | "">(
    appointmentTypeOptions[0]?.defaultDurationMinutes ?? 30,
  );
  // Set the first time the user edits the duration field directly. Once
  // true, changing the appointment type no longer overwrites their chosen
  // duration -- otherwise picking a deliberately non-default duration and
  // then touching the type dropdown (e.g. to fix a mis-click) would
  // silently discard it.
  const [durationTouched, setDurationTouched] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [confirmingOverlap, setConfirmingOverlap] = useState(false);
  const [pending, startTransition] = useTransition();
  const [workOrderId, setWorkOrderId] = useState("");
  const [customerWorkOrders, setCustomerWorkOrders] = useState<
    { id: string; number: number }[]
  >([]);

  useEffect(() => {
    const handle = setTimeout(() => {
      searchCustomersAction(query).then(setResults);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    // Cleared on every customer change, not just when the customer is
    // cleared -- otherwise picking a work order for customer A, then
    // switching to customer B, leaves `workOrderId` pointing at A's order
    // (invisible if B has none, since the picker itself then renders
    // nothing) and it would still be submitted, pairing the appointment
    // with the wrong customer's order. The server has no check tying the
    // two together, so this has to hold client-side.
    setWorkOrderId("");
    if (!customerId) {
      setCustomerWorkOrders([]);
      return;
    }
    // Ignore a response that lands after a newer customer was already
    // selected -- without this, quickly switching customer A -> B could
    // apply A's work orders to the form after B's fetch already resolved.
    let stale = false;
    listWorkOrdersForCustomerAction(customerId).then((orders) => {
      if (!stale) setCustomerWorkOrders(orders);
    });
    return () => {
      stale = true;
    };
  }, [customerId]);

  const isDurationValid =
    typeof durationMinutes === "number" &&
    Number.isInteger(durationMinutes) &&
    durationMinutes >= 5;
  // Only actually required when this is the team-week picker mode -- the
  // single-staff entry point has no `staffOptions` and a concrete
  // `staffMemberId` from the start, so it's never blocked by this.
  const isStaffChosen = staffOptions ? Boolean(selectedStaffMemberId) : true;
  // Both are already real UTC instants, so adding a duration is plain
  // millisecond arithmetic -- no timezone math needed here at all.
  const endsAtUtc = new Date(
    new Date(initialStartsAtUtc).getTime() +
      (isDurationValid ? durationMinutes : 0) * 60_000,
  ).toISOString();

  function submit(forceConfirm: boolean) {
    setError(undefined);
    const formData = new FormData();
    formData.set("staffMemberId", selectedStaffMemberId);
    formData.set("customerId", customerId);
    formData.set("workOrderId", workOrderId);
    formData.set("appointmentTypeId", typeId);
    formData.set("startsAt", initialStartsAtUtc);
    formData.set("endsAt", endsAtUtc);
    formData.set("notes", notes);

    startTransition(async () => {
      const result = await createAppointmentAction(formData, forceConfirm);
      if (!result.success) {
        if (result.error === "overlap") {
          setConfirmingOverlap(true);
          return;
        }
        setError(result.error);
        return;
      }
      onDone();
      router.refresh();
    });
  }

  return (
    <div className="w-72 space-y-3">
      <p className="text-body font-medium text-ink">{t("bookTitle")}</p>

      {/* Prominent, first thing after the title: confirms exactly what's
          being booked before the user picks anything else, and updates
          live as the duration field below changes. */}
      <p className="text-body-lg font-semibold text-ink">
        <TimeRange startsAt={initialStartsAtUtc} endsAt={endsAtUtc} timezone={timezone} />
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="appointment-customer">{t("customerLabel")}</Label>
        <Input
          id="appointment-customer"
          placeholder={t("customerSearchPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-control border border-line p-1">
          {results.map((customer) => (
            <label key={customer.id} className="flex cursor-pointer items-center gap-2 rounded-control p-1.5 hover:bg-mauve-100">
              <input
                type="radio"
                name="appointment-customer-choice"
                checked={customerId === customer.id}
                onChange={() => setCustomerId(customer.id)}
                className="accent-mauve-600"
              />
              <span className="text-meta">{customer.name}</span>
            </label>
          ))}
        </div>
      </div>

      {staffOptions ? (
        <div className="space-y-1.5">
          <Label htmlFor="appointment-staff">{t("staffLabel")}</Label>
          <select
            id="appointment-staff"
            required
            value={selectedStaffMemberId}
            onChange={(event) => setSelectedStaffMemberId(event.target.value)}
            className="h-9 w-full rounded-control border border-line bg-surface px-2 text-meta text-ink"
          >
            <option value="" disabled>
              {t("staffPlaceholder")}
            </option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.fullName}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="appointment-type">{t("typeLabel")}</Label>
        <select
          id="appointment-type"
          value={typeId}
          onChange={(event) => {
            const newTypeId = event.target.value;
            setTypeId(newTypeId);
            if (!durationTouched) {
              const newType = appointmentTypeOptions.find((type) => type.id === newTypeId);
              setDurationMinutes(newType?.defaultDurationMinutes ?? 30);
            }
          }}
          className="h-9 w-full rounded-control border border-line bg-surface px-2 text-meta text-ink"
        >
          {appointmentTypeOptions.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="appointment-duration">{t("durationLabel")}</Label>
        <Input
          id="appointment-duration"
          type="number"
          min={5}
          value={durationMinutes}
          onChange={(event) => {
            setDurationTouched(true);
            const raw = event.target.value;
            setDurationMinutes(raw === "" ? "" : Number(raw));
          }}
        />
      </div>

      {customerWorkOrders.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="appointment-work-order">{t("workOrderLabel")}</Label>
          <select
            id="appointment-work-order"
            value={workOrderId}
            onChange={(event) => setWorkOrderId(event.target.value)}
            className="h-9 w-full rounded-control border border-line bg-surface px-2 text-meta text-ink"
          >
            <option value="">{t("noWorkOrder")}</option>
            {customerWorkOrders.map((order) => (
              <option key={order.id} value={order.id}>
                #{order.number}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="appointment-notes">{t("notesLabel")}</Label>
        <Textarea id="appointment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>

      {error ? <FormMessage variant="error">{t(`errors.${error}`)}</FormMessage> : null}
      {confirmingOverlap ? (
        <FormMessage variant="error">{t("errors.overlap")}</FormMessage>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
        {confirmingOverlap ? (
          <Button
            size="sm"
            variant="danger-soft"
            disabled={pending || !customerId || !isDurationValid || !isStaffChosen}
            onClick={() => submit(true)}
          >
            {t("bookAnyway")}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={pending || !customerId || !isDurationValid || !isStaffChosen}
            onClick={() => submit(false)}
          >
            {pending ? t("saving") : t("book")}
          </Button>
        )}
      </div>
    </div>
  );
}
