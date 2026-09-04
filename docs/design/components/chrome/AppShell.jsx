import React from "react";

// Full-height side nav beside a main column. The top bar spans the main
// column only, not the viewport. Below lg, pass bottomNav instead of sideNav.
export function AppShell({ sideNav, topBar, bottomNav, children, style }) {
  return (
    <div style={{ display: "flex", minHeight: "100%", background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--font-sans)", ...style }}>
      {sideNav}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {topBar}
        <main style={{ flex: 1, minWidth: 0, padding: "var(--gutter-desktop)", overflow: "auto" }}>{children}</main>
        {bottomNav}
      </div>
    </div>
  );
}
