import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  /** Rendered beside the label, outside the <label> element (e.g. a "forgot password?" link) — keeps interactive content out of the label's click target. */
  labelAction?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Label + control + description/error as one unit, so validation copy
 * always lands in the same place relative to its input (design-system.md).
 */
export function FormField({
  label,
  htmlFor,
  labelAction,
  description,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {(label || labelAction) && (
        <div className="flex items-center justify-between">
          {label && (
            <Label htmlFor={htmlFor}>
              {label}
              {required && <span className="ms-1 text-danger-600">*</span>}
            </Label>
          )}
          {labelAction}
        </div>
      )}
      {children}
      {description && !error && <p className="text-meta text-muted">{description}</p>}
      {error && (
        <p role="alert" className="text-meta text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
