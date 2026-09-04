import { Panel } from "@/components/ui/panel";

/** Archetype I (design-system.md §3): centered Panel for login/reset/bootstrap. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel title={title} subtitle={subtitle} bodyClassName="space-y-4">
      {children}
    </Panel>
  );
}
