import { STAGE_DOT_CLASSES } from "@/components/domain/kanban-column";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "__all__";

/**
 * The "filter by work type" select (board, sprint planning). Each type's
 * dot is its *stage's* colour from `STAGE_DOT_CLASSES` -- the same identity
 * the type's tasks show up under as a board column -- not a colour of its
 * own, so "Handmade" here is recognisably the same stage as the "Handmade"
 * column.
 */
export function TaskTypeFilterSelect({
  value,
  onChange,
  taskTypes,
  allLabel,
  ariaLabel,
  className,
}: {
  /** `""` means "all". */
  value: string;
  onChange: (value: string) => void;
  taskTypes: { id: string; name: string; stageIndex: number }[];
  allLabel: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(next) => onChange(next === ALL ? "" : next)}
    >
      <SelectTrigger aria-label={ariaLabel} className={className}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {taskTypes.map((type) => (
          <SelectItem key={type.id} value={type.id}>
            <span
              className={cn(
                "size-[8px] shrink-0 rounded-full",
                STAGE_DOT_CLASSES[type.stageIndex % STAGE_DOT_CLASSES.length],
              )}
              aria-hidden="true"
            />
            <span className="truncate">{type.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
