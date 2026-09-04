export interface StepperProps {
  /** Stage names, in order. */
  steps: (string | { label: string })[];
  /** Index of the current stage. Everything before it is completed. */
  current?: number;
}
export function Stepper(props: StepperProps): JSX.Element;
