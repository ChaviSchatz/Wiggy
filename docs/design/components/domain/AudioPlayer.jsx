import React from "react";
import { Icon } from "../core/Icon.jsx";

// Playback for a voice-note attachment.
export function AudioPlayer({ src, durationLabel, title = "הקלטה", style }) {
  const ref = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (playing) { el.pause(); } else { el.play(); }
    setPlaying(!playing);
  };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--surface)",
      border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", ...style,
    }}>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "השהיה" : "נגינה"}
        style={{
          width: 36, height: 36, flex: "none", borderRadius: "var(--radius-full)", border: "none", cursor: "pointer",
          background: "var(--mauve-600)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name={playing ? "pause" : "play"} size={16} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ height: 3, borderRadius: 2, background: "var(--line)", marginTop: 6 }}>
          <div style={{ width: playing ? "38%" : "0%", height: "100%", borderRadius: 2, background: "var(--mauve-600)", transition: "width 200ms cubic-bezier(0,0,.2,1)" }} />
        </div>
      </div>
      {durationLabel && <span style={{ fontSize: "var(--text-meta)", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{durationLabel}</span>}
      <audio ref={ref} src={src} onEnded={() => setPlaying(false)} style={{ display: "none" }} />
    </div>
  );
}
