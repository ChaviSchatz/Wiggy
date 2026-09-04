import * as React from "react";
export interface WizardStepperProps {
  steps: (string | { label: string })[];
  /** Index of the current step. Everything before it is completed. */
  current?: number;
  /** Only completed steps are clickable; omit for a read-only stepper. */
  onStepClick?: (index: number) => void;
  style?: React.CSSProperties;
}
export function WizardStepper(props: WizardStepperProps): JSX.Element;
