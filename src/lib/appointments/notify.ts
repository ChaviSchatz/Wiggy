import "server-only";

/**
 * Customer appointment notifications. A missing/disabled channel never fails
 * the caller, it just doesn't send -- the caller (a booking Server Action, or
 * the reminder cron sweep in a later task) never needs to branch on whether
 * notification succeeded.
 *
 * Note: `src/lib/feedback/notify.ts` does not exist in this codebase (there is
 * no prior Resend usage anywhere -- `resend` was not even a dependency yet),
 * so there is no verified custom domain to reuse. `FROM_ADDRESS` below uses
 * Resend's documented sandbox sender, which needs no domain verification.
 */

export type AppointmentEventKind = "confirmation" | "reminder" | "cancellation";

export type NotifyAppointmentEventInput = {
  kind: AppointmentEventKind;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  appointmentTypeName: string;
  startsAt: string;
  settings: {
    sendConfirmation: boolean;
    sendReminder: boolean;
    reminderLeadHours: number;
    emailEnabled: boolean;
    whatsappEnabled: boolean;
  };
};

export type NotifyAppointmentEventResult = {
  emailSent: boolean;
  emailSkippedReason?: "noEmail" | "channelDisabled" | "error";
  whatsappSent: boolean;
  whatsappSkippedReason?: "noPhone" | "channelDisabled" | "providerNotConfigured" | "error";
};

export async function notifyAppointmentEvent(
  input: NotifyAppointmentEventInput,
): Promise<NotifyAppointmentEventResult> {
  const result: NotifyAppointmentEventResult = {
    emailSent: false,
    whatsappSent: false,
  };

  if (!input.settings.emailEnabled) {
    result.emailSkippedReason = "channelDisabled";
  } else if (!input.customerEmail) {
    result.emailSkippedReason = "noEmail";
  } else {
    try {
      await sendEmail(input.customerEmail, input);
      result.emailSent = true;
    } catch (error) {
      console.error("[appointments/notify] email send failed", error);
      result.emailSkippedReason = "error";
    }
  }

  if (!input.settings.whatsappEnabled) {
    result.whatsappSkippedReason = "channelDisabled";
  } else if (!input.customerPhone) {
    result.whatsappSkippedReason = "noPhone";
  } else if (!process.env.WHATSAPP_PROVIDER_API_KEY) {
    console.warn("[appointments/notify] WHATSAPP_PROVIDER_API_KEY not set, skipping WhatsApp send");
    result.whatsappSkippedReason = "providerNotConfigured";
  } else {
    try {
      await sendWhatsapp(input.customerPhone, input);
      result.whatsappSent = true;
    } catch (error) {
      console.error("[appointments/notify] whatsapp send failed", error);
      result.whatsappSkippedReason = "error";
    }
  }

  return result;
}

async function sendEmail(
  to: string,
  input: NotifyAppointmentEventInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[appointments/notify] RESEND_API_KEY not set, skipping email send");
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: subjectFor(input),
    text: bodyFor(input),
  });
}

// Resend's own documented sandbox sender -- needs no domain verification, so
// this works unmodified in every environment. `resend` was not a dependency
// anywhere in this codebase before this module, so there is no existing
// verified custom domain to reuse; swap this for one once a domain is
// verified.
const FROM_ADDRESS = "Wiggy <onboarding@resend.dev>";

/** Stub: no WhatsApp Business API provider chosen yet. Whoever picks one fills this in; nothing else about the feature changes. */
async function sendWhatsapp(
  to: string,
  input: NotifyAppointmentEventInput,
): Promise<void> {
  void to;
  void input;
  throw new Error("WhatsApp provider not implemented");
}

function subjectFor(input: NotifyAppointmentEventInput): string {
  switch (input.kind) {
    case "confirmation":
      return `Appointment confirmed: ${input.appointmentTypeName}`;
    case "reminder":
      return `Reminder: ${input.appointmentTypeName} coming up`;
    case "cancellation":
      return `Appointment cancelled: ${input.appointmentTypeName}`;
  }
}

function bodyFor(input: NotifyAppointmentEventInput): string {
  const when = new Date(input.startsAt).toLocaleString("he-IL");
  switch (input.kind) {
    case "confirmation":
      return `Hi ${input.customerName}, your ${input.appointmentTypeName} appointment is confirmed for ${when}.`;
    case "reminder":
      return `Hi ${input.customerName}, this is a reminder for your ${input.appointmentTypeName} appointment on ${when}.`;
    case "cancellation":
      return `Hi ${input.customerName}, your ${input.appointmentTypeName} appointment on ${when} has been cancelled.`;
  }
}
