import type { Tables } from "@/lib/supabase/database.types";

export type Appointment = Tables<"appointments">;
export type AppointmentStatus = Appointment["status"];

/** An appointment enriched with the display data the calendar/board/hub need. */
export type AppointmentListItem = Appointment & {
  customerName: string;
  staffMemberName: string | null;
  appointmentTypeName: string;
  appointmentTypeColor: string | null;
};
