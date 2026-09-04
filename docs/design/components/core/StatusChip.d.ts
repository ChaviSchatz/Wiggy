/**
 * @startingPoint section="Core" subtitle="Domain status → colour, in one place" viewport="700x150"
 */
export interface StatusChipProps {
  /** Domain status key — task, order, missing-item, availability or urgency. Resolves the colour family. */
  status?: string;
  /** Escape hatch when the status key is tenant-defined. Prefer `status`. */
  family?: "sage" | "peach" | "danger" | "info" | "mauve" | "idle";
  /** The translated label. Copy comes from the i18n catalog, never from this component. */
  children: React.ReactNode;
  /** `lg` for tablet surfaces. */
  size?: "default" | "lg";
}
export function StatusChip(props: StatusChipProps): JSX.Element;
