import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

/**
 * The "filter by employee" select, everywhere it appears (board, sprint,
 * missing items). Every option -- and the trigger once one is picked --
 * leads with the worker's `Avatar`: this is still a person, even inside a
 * filter, not just a name in a list.
 */
export function StaffFilterSelect({
  value,
  onChange,
  staff,
  allLabel,
  unassignedLabel,
  ariaLabel,
}: {
  /** `""` means "all". */
  value: string;
  onChange: (value: string) => void;
  staff: { id: string; full_name: string }[];
  allLabel: string;
  /** Omit to skip the "unassigned" option. */
  unassignedLabel?: string;
  ariaLabel: string;
}) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(next) => onChange(next === ALL ? "" : next)}
    >
      <SelectTrigger aria-label={ariaLabel} className="w-auto min-w-40">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {unassignedLabel ? (
          <SelectItem value="unassigned">{unassignedLabel}</SelectItem>
        ) : null}
        {staff.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            <Avatar name={member.full_name} size="sm" />
            <span className="truncate">{member.full_name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
