/**
 * @startingPoint section="Domain" subtitle="Dashboard metric, one emphasis per view" viewport="700x160"
 */
export interface KpiCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  caption?: React.ReactNode;
  /** Small plum-soft eyebrow — only on the emphasised card. */
  eyebrow?: React.ReactNode;
  /** 2px mauve-600/34% border. At most one per view. */
  emphasis?: boolean;
  onClick?: () => void;
}
export function KpiCard(props: KpiCardProps): JSX.Element;
