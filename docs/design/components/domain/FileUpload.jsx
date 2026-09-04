import React from "react";
import { Icon } from "../core/Icon.jsx";
import { Button } from "../core/Button.jsx";

// Order attachments: photos, files, voice notes.
export function FileUpload({ label = "גרירת קובץ לכאן", hint, onSelect, accept, style }) {
  const [over, setOver] = React.useState(false);
  const input = React.useRef(null);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onSelect && onSelect(Array.from(e.dataTransfer.files)); }}
      style={{
        display: "grid", justifyItems: "center", gap: 8, padding: "22px 16px", textAlign: "center",
        borderRadius: "var(--radius-md)", background: over ? "var(--mauve-100)" : "var(--cream)",
        border: `1px dashed ${over ? "var(--mauve-600)" : "var(--line-strong)"}`,
        transition: "background-color 150ms cubic-bezier(0,0,.2,1), border-color 150ms cubic-bezier(0,0,.2,1)", ...style,
      }}
    >
      <Icon name="upload" size={20} style={{ color: "var(--mauve-600)" }} />
      <div style={{ fontSize: "var(--text-body)", color: "var(--ink)" }}>{label}</div>
      {hint && <div style={{ fontSize: "var(--text-meta)", color: "var(--muted)" }}>{hint}</div>}
      <Button variant="soft" size="sm" onClick={() => input.current && input.current.click()}>בחירת קובץ</Button>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => onSelect && onSelect(Array.from(e.target.files))}
        style={{ display: "none" }}
      />
    </div>
  );
}
