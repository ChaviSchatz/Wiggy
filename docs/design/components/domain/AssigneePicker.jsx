import React from "react";
import { Avatar } from "../core/Avatar.jsx";
import { Icon } from "../core/Icon.jsx";

// Reached by tapping a board card's avatar.
export function AssigneePicker({ staff = [], value, onChange, unassignedLabel = "ללא אחראי", style }) {
  const [open, setOpen] = React.useState(false);
  const [drop, setDrop] = React.useState({ up: false, max: 190 });
  const ref = React.useRef(null);
  const btnRef = React.useRef(null);

  // The control usually sits at the bottom of a scrolling drawer, so opening
  // downward is the exception, not the rule: measure the room on each side and
  // flip, then cap the list to whatever that side actually offers.
  const place = React.useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    let top = 0, bottom = window.innerHeight;
    for (let p = el.parentElement; p; p = p.parentElement) {
      const o = getComputedStyle(p).overflowY;
      if (o === "auto" || o === "scroll" || o === "hidden") {
        const r = p.getBoundingClientRect();
        top = Math.max(top, r.top);
        bottom = Math.min(bottom, r.bottom);
      }
    }
    const r = el.getBoundingClientRect();
    const below = bottom - r.bottom - 10;
    const above = r.top - top - 10;
    const up = below < 120 && above > below;
    setDrop({ up, max: Math.max(84, Math.min(190, up ? above : below)) });
  }, []);

  React.useLayoutEffect(() => { if (open) place(); }, [open, place]);
  React.useEffect(() => {
    if (!open) return;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", esc);
    window.addEventListener("resize", place);
    return () => { document.removeEventListener("mousedown", away); window.removeEventListener("keydown", esc); window.removeEventListener("resize", place); };
  }, [open, place]);

  const sel = staff.find((s) => String(s.id) === String(value));
  const blank = (size) => (
    <span style={{ width: size, height: size, flex: "none", borderRadius: "var(--radius-full)", background: "var(--idle-100)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--faint)" }}>
      <Icon name="user-x" size={size - 10} strokeWidth={1.7} />
    </span>
  );

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button
        ref={btnRef} type="button" aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0,
          height: "var(--control-height)", padding: "0 9px", borderRadius: "var(--radius-xs)",
          border: "1px solid " + (open ? "var(--mauve-600)" : "var(--line)"), background: "var(--surface)",
          cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink)", textAlign: "start",
        }}
      >
        {sel ? <Avatar name={sel.name} src={sel.src} size="xs" /> : blank(22)}
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sel ? sel.name : unassignedLabel}
        </span>
        <Icon name="chevron-down" size={14} strokeWidth={1.7} style={{ color: "var(--faint)", flex: "none" }} />
      </button>

      {open && (
        <ul role="listbox" style={{
          position: "absolute", insetInlineStart: 0, insetInlineEnd: 0,
          top: drop.up ? "auto" : "calc(100% + 4px)", bottom: drop.up ? "calc(100% + 4px)" : "auto",
          zIndex: "var(--z-overlay)", listStyle: "none", margin: 0, padding: 4, maxHeight: drop.max, overflow: "auto",
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-xs)",
          boxShadow: "var(--shadow-overlay)",
        }}>
          {[{ id: null, name: unassignedLabel }, ...staff].map((s) => {
            const active = (s.id == null ? null : String(s.id)) === (value == null ? null : String(value));
            return (
              <li key={s.id || "none"}>
                <button
                  type="button" role="option" aria-selected={active}
                  onClick={() => { setOpen(false); if (onChange) onChange(s.id); }}
                  style={{
                    width: "100%", minHeight: 30, display: "flex", alignItems: "center", gap: 8, textAlign: "start",
                    padding: "0 7px", border: "none", cursor: "pointer", borderRadius: 7,
                    background: active ? "var(--mauve-100)" : "transparent",
                    color: active ? "var(--mauve-700)" : "var(--ink)", fontWeight: active ? 600 : 400,
                    fontFamily: "var(--font-sans)", fontSize: 12.5,
                  }}
                >
                  {s.id ? <Avatar name={s.name} src={s.src} size="xs" /> : blank(22)}
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  {active && <Icon name="check" size={13} strokeWidth={2} style={{ flex: "none" }} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
