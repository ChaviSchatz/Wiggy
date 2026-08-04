import { Button } from "@/components/ui/button";

/** Design-system "UndoToast" -- a short grace window after an optimistic status change. */
export function UndoToast({
  message,
  actionLabel,
  onUndo,
}: {
  message: string;
  actionLabel: string;
  onUndo: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-6">
      <div className="flex items-center gap-3 rounded-control bg-ink px-4 py-3 text-sm text-white shadow-lg">
        <span>{message}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-auto p-0 text-white underline hover:bg-transparent hover:text-white"
          onClick={onUndo}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
