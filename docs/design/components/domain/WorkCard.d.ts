/**
 * @startingPoint section="Domain" subtitle="The one task card — board, sprint, My Work" viewport="700x220"
 */
export interface WorkCardProps {
  /** Identity leads with the customer name; a customer-less order passes the template name. */
  customerName: string;
  orderCode: string;
  /** The task title — the actionable line. The template and stage names never appear here. */
  taskName?: string;
  /** Domain status key for StatusChip. The chip is the card's state vocabulary and always
   *  renders when set — an inline action sits beside it, it does not replace it. Omit
   *  `status` on surfaces that should read as action-only. */
  status?: string;
  statusLabel?: string;
  /** Urgency is a filled danger star beside the identity, never a chip. Normal renders nothing (ADR 0012). */
  urgent?: boolean;
  /** Legacy form of the same flag: "urgent" | "blocked" | "normal". */
  urgency?: "normal" | "urgent" | "blocked";
  /** Accessible label for the star. */
  urgencyLabel?: string;
  /** Sequence-unavailable or deferred (ADR 0008): reduced opacity, dashed edge, Lock chip. */
  blocked?: boolean;
  blockedLabel?: string;
  /** Manager-only documented override. Omit for workers. */
  onUnlock?: () => void;
  unlockLabel?: string;
  /** Worker name; renders the circular avatar. Tap = reassign. */
  assignee?: string;
  /** Ignored on variant="board" — the board stays textual. */
  referencePhotoUrl?: string | null;
  /** Task due date, falling back to the order's. Omitted when neither is set. */
  due?: string;
  /** Any other trailing metadata; `due` wins when both are set. */
  meta?: string;
  variant?: "board" | "sprint" | "planning" | "queue";
  startLabel?: string;
  doneLabel?: string;
  onOpen?: () => void;
  onStart?: () => void;
  onDone?: () => void;
  onReassign?: () => void;
  /** Planning variant only: explicit reorder, never pointer drag. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}
export function WorkCard(props: WorkCardProps): JSX.Element;
