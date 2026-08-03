import { cn } from "@/lib/utils";

/** Inline banner for form-level success/error feedback (redirect-driven forms). */
export function FormMessage({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-control px-3 py-2 text-sm",
        variant === "error"
          ? "bg-danger-600/10 text-danger-600"
          : "bg-sage-100 text-sage-600",
      )}
    >
      {children}
    </p>
  );
}
