import React from "react";

// White ground, fine border, almost no shadow. Depth is not how this system
// separates things — the border and the space around it are.
export function Card({ interactive, raised, children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      style={{
        background: "var(--surface)", borderRadius: "var(--radius-sm)",
        border: `1px solid ${hover ? "var(--line-strong)" : "var(--line)"}`,
        boxShadow: raised ? "var(--shadow-card)" : "none",
        transition: "border-color 150ms cubic-bezier(0,0,.2,1), box-shadow 150ms cubic-bezier(0,0,.2,1)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
