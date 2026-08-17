import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

/** Progress stepper (docs/ui/work-order-hub.md): the order's stages, current stage highlighted. */
export function ProgressStepper({
  stages,
  currentStageId,
  reachedStageIds,
}: {
  stages: Tables<"work_stages">[];
  currentStageId: string | null;
  reachedStageIds: Set<string>;
}) {
  if (stages.length === 0) return null;

  return (
    <ol className="flex items-center overflow-x-auto pb-1">
      {stages.map((stage, index) => {
        const isCurrent = stage.id === currentStageId;
        const isDone = reachedStageIds.has(stage.id) && !isCurrent;
        return (
          <li key={stage.id} className="flex shrink-0 items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-sage-100 text-sage-600"
                      : "bg-mauve-100 text-muted",
                )}
              >
                {isDone ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "max-w-20 truncate text-center text-xs",
                  isCurrent ? "font-medium text-ink" : "text-muted",
                )}
              >
                {stage.name}
              </span>
            </div>
            {index < stages.length - 1 ? (
              <span
                className={cn(
                  "mx-1 mb-4 h-px w-8 shrink-0",
                  isDone ? "bg-sage-300" : "bg-line",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
