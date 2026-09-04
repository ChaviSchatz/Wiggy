import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Staff picker (design-system.md §4): every row leads with the worker's
 * `Avatar`, never a bare name in a plain list -- this is the one place in
 * the product where you're choosing *a person*, so the picker should look
 * like one. Selected reads as a plum outline on a `mauve-100` wash, the
 * same treatment `SelectableOption` uses everywhere else.
 */
export function AssigneePicker({
  staff,
  value,
  onChange,
  unassignedLabel,
}: {
  staff: { id: string; name: string }[];
  value: string | null;
  onChange: (staffId: string | null) => void;
  unassignedLabel: string;
}) {
  return (
    <div role="radiogroup" className="max-h-64 space-y-1 overflow-y-auto">
      <AssigneeRow
        name={null}
        label={unassignedLabel}
        selected={value === null}
        onSelect={() => onChange(null)}
      />
      {staff.map((member) => (
        <AssigneeRow
          key={member.id}
          name={member.name}
          label={member.name}
          selected={value === member.id}
          onSelect={() => onChange(member.id)}
        />
      ))}
    </div>
  );
}

function AssigneeRow({
  name,
  label,
  selected,
  onSelect,
}: {
  /** `null` renders the unassigned state's dashed-ring avatar. */
  name: string | null;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-control border p-2 text-start transition-colors",
        selected
          ? "border-mauve-600 bg-mauve-100"
          : "border-transparent hover:bg-mauve-100/50",
      )}
    >
      <Avatar name={name} size="sm" />
      <span className="truncate text-body text-ink">{label}</span>
    </button>
  );
}
