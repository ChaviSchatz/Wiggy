import React from "react";
import { Card } from "../core/Card.jsx";
import { Avatar } from "../core/Avatar.jsx";
import { StatusChip } from "../core/StatusChip.jsx";
import { WorkImage } from "../core/WorkImage.jsx";
import { Button } from "../core/Button.jsx";
import { IconButton } from "../core/IconButton.jsx";
import { Icon } from "../core/Icon.jsx";

// Only these statuses earn a filled chip. Ordinary flow reads as quiet text, so
// a column of a dozen cards does not turn into a colour chart.
const EXCEPTION = { awaiting_approval: 1, returned_for_rework: 1, blocked: 1, deferred: 1 };

// The single task card: board, sprint planning and My Work share it through
// variants, not through three implementations.
//
// Hierarchy, strongest first: customer name, work type, assignee, due,
// exception, order code. Everything below the name is metadata weight — the
// card should read as a line of type, not as a container of badges. The board
// variant carries no photograph of any kind; a circular avatar is an employee.
export function WorkCard({
  customerName, orderCode, taskName, status, statusLabel,
  urgent, urgency, urgencyLabel, blocked, blockedLabel = "חסום", onUnlock, unlockLabel = "פתיחה",
  assignee, assigneePhotoUrl, referencePhotoUrl, due, meta, variant = "board",
  startLabel = "התחלה", doneLabel = "סיום", openLabel = "פתיחה",
  onOpen, onStart, onDone, onReassign, onMoveUp, onMoveDown, style,
}) {
  const [actHover, setActHover] = React.useState(false);
  const tablet = variant === "queue";
  const planning = variant === "planning" || variant === "sprint";
  const dense = variant === "board";
  const isUrgent = urgent || urgency === "urgent";
  const isBlocked = blocked || urgency === "blocked" || status === "blocked";
  const trailing = due || meta;
  const action = isBlocked ? null : (onDone || onStart);
  const exception = isBlocked || (status && EXCEPTION[status]);

  const state = isBlocked ? (
    <StatusChip status="blocked" size={tablet ? "lg" : "default"} dot={false} style={{ maxWidth: "100%", overflow: "hidden" }}>
      <Icon name="lock" size={10} strokeWidth={1.8} />{blockedLabel}
    </StatusChip>
  ) : status ? (
    <StatusChip status={status} size={tablet ? "lg" : "default"} quiet={!exception} style={{ maxWidth: "100%", overflow: "hidden" }}>{statusLabel}</StatusChip>
  ) : null;

  return (
    <Card
      interactive={!isBlocked}
      onClick={onOpen}
      style={{
        padding: tablet ? "12px 13px" : "10px 11px", display: "block", minWidth: 0, overflow: "hidden",
        borderStyle: isBlocked ? "dashed" : "solid",
        opacity: isBlocked ? 0.66 : 1, cursor: onOpen ? "pointer" : "default", ...style,
      }}
    >
      {/* Row 1 — identity. The name owns the line; the code is the quietest thing on the card. */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
        {isUrgent && (
          <Icon name="star" size={11} fill="currentColor" role="img" aria-hidden={false}
                aria-label={urgencyLabel || "דחוף"} style={{ color: "var(--danger-500)", flex: "none" }} />
        )}
        <span style={{
          flex: "1 1 auto", minWidth: 0,
          fontSize: tablet ? "var(--text-identity-lg)" : 13,
          fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.005em", color: "var(--ink)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {customerName}
        </span>
        <span style={{ flex: "none", fontSize: 10, fontWeight: 400, color: "var(--faint)", fontVariantNumeric: "tabular-nums" }}>
          {orderCode}
        </span>
      </div>

      {/* Row 2 — work type / context. */}
      {taskName && (
        <div style={{ marginTop: 3, fontSize: tablet ? 12.5 : 11.5, lineHeight: 1.35, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{taskName}</div>
      )}

      {!dense && referencePhotoUrl && (
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <WorkImage src={referencePhotoUrl} alt="" size={tablet ? 64 : 48} />
        </div>
      )}

      {/* Row 3 — metadata, then a dedicated action slot. The metadata group wraps
          within itself; the action never wraps into the middle of it. */}
      <div style={{ marginTop: 8, display: "flex", alignItems: "flex-end", gap: 6, minWidth: 0 }}>
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 6px" }}>
          {assignee && <Avatar name={assignee} src={assigneePhotoUrl} size={tablet ? "lg" : "xs"} onClick={onReassign} />}
          {trailing && (
            <span style={{ fontSize: 10.5, color: "var(--faint)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{trailing}</span>
          )}
          {state}
        </div>

        {planning && (onMoveUp || onMoveDown) && (
          <span style={{ flex: "none", display: "flex", gap: 2 }}>
            {onMoveUp && <IconButton size={24} icon={<Icon name="chevron-up" size={14} strokeWidth={1.7} />} label="הזזה למעלה" onClick={onMoveUp} />}
            {onMoveDown && <IconButton size={24} icon={<Icon name="chevron-down" size={14} strokeWidth={1.7} />} label="הזזה למטה" onClick={onMoveDown} />}
          </span>
        )}
        {isBlocked && onUnlock && (
          <span style={{ flex: "none" }}><Button variant="ghost" size="xs" onClick={onUnlock}>{unlockLabel}</Button></span>
        )}
        {action && (dense ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); (onDone || onStart)(); }}
            onMouseEnter={() => setActHover(true)}
            onMouseLeave={() => setActHover(false)}
            aria-label={onDone ? doneLabel : startLabel}
            title={onDone ? doneLabel : startLabel}
            style={{
              width: 22, height: 22, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--radius-full)", cursor: "pointer",
              border: "1px solid " + (actHover ? "var(--mauve-600)" : "var(--line-strong)"),
              background: actHover ? "var(--mauve-600)" : "transparent",
              color: actHover ? "#fff" : "var(--muted)",
              transition: "background-color 150ms cubic-bezier(0,0,.2,1), border-color 150ms cubic-bezier(0,0,.2,1), color 150ms cubic-bezier(0,0,.2,1)",
            }}
          >
            <Icon name={onDone ? "check" : "play"} size={12} strokeWidth={2} />
          </button>
        ) : (
          <span style={{ flex: "none" }}>
            <Button variant="outline" size={tablet ? "lg" : "xs"} onClick={onDone || onStart}
                    iconStart={onDone ? <Icon name="check" size={13} strokeWidth={2} /> : undefined}>
              {onDone ? doneLabel : startLabel}
            </Button>
          </span>
        ))}
      </div>
    </Card>
  );
}
