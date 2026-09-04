export interface AssigneePickerProps {
  staff: { id: string; name: string }[];
  value?: string | null;
  onChange?: (staffId: string | null) => void;
  unassignedLabel?: string;
}
export function AssigneePicker(props: AssigneePickerProps): JSX.Element;
