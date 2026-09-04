"use client";

import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UNASSIGNED = "__unassigned__";

/**
 * The compact "assign this to someone" control (sprint cards, missing-item
 * responsibility) -- the single-pick sibling of `StaffFilterSelect`
 * (filtering) and `AssigneePicker` (the full dialog-body list). Every
 * option, and the trigger once one's picked, leads with the worker's
 * `Avatar`.
 *
 * Supports both controlled use (`value`/`onChange`) and native-form use
 * (`name`/`defaultValue`, read via `FormData` on submit like the native
 * `<select>` it replaces) -- Radix's `Select` isn't a real form control, so
 * `name` mode renders a synced hidden input.
 */
export function AssigneeSelect({
  id,
  name,
  value: controlledValue,
  defaultValue = null,
  onChange,
  staff,
  unassignedLabel,
  ariaLabel,
  className,
}: {
  /** Forwarded to the trigger so a `<Label htmlFor>` can target it. */
  id?: string;
  name?: string;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (staffMemberId: string | null) => void;
  staff: { id: string; full_name: string }[];
  unassignedLabel: string;
  ariaLabel: string;
  className?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  function handleChange(next: string) {
    const resolved = next === UNASSIGNED ? null : next;
    if (!isControlled) setInternalValue(resolved);
    onChange?.(resolved);
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <Select value={value ?? UNASSIGNED} onValueChange={handleChange}>
        <SelectTrigger id={id} aria-label={ariaLabel} className={className}>
          <SelectValue placeholder={unassignedLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED}>{unassignedLabel}</SelectItem>
          {staff.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              <Avatar name={member.full_name} size="sm" />
              <span className="truncate">{member.full_name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
