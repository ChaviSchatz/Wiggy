// src/lib/appointments/queries.test.ts
import { describe, expect, it } from "vitest";

import { toAppointmentListItems } from "./queries";
import type { Appointment } from "./types";

const baseRow: Appointment = {
  id: "a1",
  business_id: "b1",
  staff_member_id: "s1",
  customer_id: "c1",
  work_order_id: null,
  appointment_type_id: "t1",
  starts_at: "2026-09-14T10:00:00Z",
  ends_at: "2026-09-14T10:30:00Z",
  status: "scheduled",
  notes: null,
  created_by: null,
  cancelled_at: null,
  cancelled_by: null,
  reminder_sent_at: null,
  created_at: "2026-09-14T09:00:00Z",
  updated_at: "2026-09-14T09:00:00Z",
};

describe("toAppointmentListItems", () => {
  it("joins customer, staff and type names by id", () => {
    const [item] = toAppointmentListItems([baseRow], {
      customerById: new Map([["c1", { id: "c1", name: "Rina Cohen" }]]),
      staffById: new Map([["s1", { id: "s1", full_name: "Dana" }]]),
      typeById: new Map([["t1", { id: "t1", name: "Fitting", color: "#672B62" }]]),
    });
    expect(item.customerName).toBe("Rina Cohen");
    expect(item.staffMemberName).toBe("Dana");
    expect(item.appointmentTypeName).toBe("Fitting");
    expect(item.appointmentTypeColor).toBe("#672B62");
  });

  it("degrades to null/empty when a lookup is missing rather than throwing", () => {
    const [item] = toAppointmentListItems([{ ...baseRow, staff_member_id: null }], {
      customerById: new Map(),
      staffById: new Map(),
      typeById: new Map(),
    });
    expect(item.customerName).toBe("");
    expect(item.staffMemberName).toBeNull();
    expect(item.appointmentTypeName).toBe("");
    expect(item.appointmentTypeColor).toBeNull();
  });
});
