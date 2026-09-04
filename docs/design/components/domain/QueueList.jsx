import React from "react";

// The sectioned personal queue: now -> next -> up next -> blocked -> done.
export function QueueList({ sections = [], style }) {
  return (
    <div style={{ display: "grid", gap: 24, ...style }}>
      {sections.map((s) => (
        <section key={s.id} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 2, height: 16, borderRadius: 2, background: "var(--hairline)" }} />
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-section)", fontWeight: 700 }}>{s.title}</h2>
            {s.items?.length != null && (
              <span style={{ fontSize: "var(--text-meta)", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{s.items.length}</span>
            )}
          </div>
          {s.description && <p style={{ margin: 0, fontSize: "var(--text-meta)", color: "var(--muted)" }}>{s.description}</p>}
          <div style={{ display: "grid", gap: 10 }}>{s.children}</div>
        </section>
      ))}
    </div>
  );
}
