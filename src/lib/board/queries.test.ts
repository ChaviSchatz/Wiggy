// src/lib/board/queries.test.ts
import { describe, expect, it } from "vitest";

import { nearestAppointmentByWorkOrderId } from "./queries";

describe("nearestAppointmentByWorkOrderId", () => {
  it("keeps only the earliest row per work order, assuming ascending input", () => {
    const result = nearestAppointmentByWorkOrderId(
      [
        {
          work_order_id: "wo1",
          starts_at: "2026-09-16T10:00:00Z",
          appointment_type_id: "t1",
        },
        {
          work_order_id: "wo1",
          starts_at: "2026-09-20T10:00:00Z",
          appointment_type_id: "t1",
        },
        {
          work_order_id: "wo2",
          starts_at: "2026-09-17T10:00:00Z",
          appointment_type_id: "t2",
        },
      ],
      new Map([
        ["t1", "Fitting"],
        ["t2", "Consultation"],
      ]),
    );

    expect(result.get("wo1")).toEqual({
      typeName: "Fitting",
      startsAt: "2026-09-16T10:00:00Z",
    });
    expect(result.get("wo2")).toEqual({
      typeName: "Consultation",
      startsAt: "2026-09-17T10:00:00Z",
    });
  });

  it("skips rows with no work_order_id and resolves an unknown type name to empty string", () => {
    const result = nearestAppointmentByWorkOrderId(
      [
        {
          work_order_id: null,
          starts_at: "2026-09-16T10:00:00Z",
          appointment_type_id: "t1",
        },
        {
          work_order_id: "wo1",
          starts_at: "2026-09-16T10:00:00Z",
          appointment_type_id: "unknown-type",
        },
      ],
      new Map(),
    );

    expect(result.size).toBe(1);
    expect(result.get("wo1")).toEqual({
      typeName: "",
      startsAt: "2026-09-16T10:00:00Z",
    });
  });

  it("returns an empty map for no rows", () => {
    expect(nearestAppointmentByWorkOrderId([], new Map()).size).toBe(0);
  });
});
