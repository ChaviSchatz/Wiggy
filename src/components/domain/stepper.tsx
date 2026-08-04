import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Design-system Archetype C (Wizard): Stepper + step body + footer nav. */
export function Stepper({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <ol className="mb-6 flex items-center">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                  isDone
                    ? "bg-sage-600 text-white"
                    : isActive
                      ? "bg-mauve-600 text-white"
                      : "bg-mauve-100 text-muted",
                )}
              >
                {isDone ? <Check className="size-4" aria-hidden /> : stepNumber}
              </span>
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  isActive ? "font-medium text-ink" : "text-muted",
                )}
              >
                {label}
              </span>
            </div>
            {stepNumber < steps.length ? (
              <div
                className={cn(
                  "mx-3 h-px flex-1",
                  isDone ? "bg-sage-600" : "bg-line",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
