import { describe, expect, it } from "vitest";

import { notifyAppointmentEvent } from "./notify";

describe("notifyAppointmentEvent", () => {
  const baseInput = {
    kind: "confirmation" as const,
    customerName: "Rina Cohen",
    customerEmail: null,
    customerPhone: null,
    appointmentTypeName: "Fitting",
    startsAt: "2026-09-14T10:00:00Z",
    settings: {
      sendConfirmation: true,
      sendReminder: false,
      reminderLeadHours: 24,
      emailEnabled: true,
      whatsappEnabled: false,
    },
  };

  it("skips email silently when the customer has no email", async () => {
    const result = await notifyAppointmentEvent(baseInput);
    expect(result.emailSent).toBe(false);
    expect(result.emailSkippedReason).toBe("noEmail");
  });

  it("skips whatsapp with a distinct reason when unconfigured, even with a phone on file", async () => {
    const result = await notifyAppointmentEvent({
      ...baseInput,
      customerPhone: "+972501234567",
      settings: { ...baseInput.settings, whatsappEnabled: true },
    });
    expect(result.whatsappSent).toBe(false);
    expect(result.whatsappSkippedReason).toBe("providerNotConfigured");
  });

  it("skips a channel the tenant has disabled, regardless of contact info", async () => {
    const result = await notifyAppointmentEvent({
      ...baseInput,
      customerEmail: "rina@example.com",
      settings: { ...baseInput.settings, emailEnabled: false },
    });
    expect(result.emailSent).toBe(false);
    expect(result.emailSkippedReason).toBe("channelDisabled");
  });
});
