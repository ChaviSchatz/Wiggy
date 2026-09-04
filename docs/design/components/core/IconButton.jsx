import React from "react";

export function IconButton({ icon, label, size = "var(--icon-button-size)", style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8, border: "1px solid transparent", cursor: "pointer",
        background: hover ? "var(--mauve-100)" : "transparent",
        color: hover ? "var(--mauve-600)" : "var(--muted)",
        transition: "background-color 150ms cubic-bezier(0,0,.2,1), color 150ms cubic-bezier(0,0,.2,1)", ...style,
      }}
      {...rest}
    >
      {icon}
    </button>
  );
}
