import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          soft: "var(--surface-soft)",
        },
        cream: "var(--cream)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
        hairline: "var(--hairline)",
        // Brand. Named `mauve` for historical reasons; the values are plum.
        mauve: {
          100: "var(--mauve-100)",
          200: "var(--mauve-200)",
          600: "var(--mauve-600)",
          700: "var(--mauve-700)",
          900: "var(--mauve-900)",
        },
        // Status triplets. `-500` is for dots/borders only — it fails AA for
        // text against its own `-100` ground, which is why `-600` exists.
        sage: {
          100: "var(--sage-100)",
          200: "var(--sage-200)",
          300: "var(--sage-300)",
          500: "var(--sage-500)",
          600: "var(--sage-600)",
        },
        peach: {
          100: "var(--peach-100)",
          200: "var(--peach-200)",
          500: "var(--peach-500)",
          600: "var(--peach-600)",
        },
        danger: {
          100: "var(--danger-100)",
          200: "var(--danger-200)",
          500: "var(--danger-500)",
          600: "var(--danger-600)",
        },
        info: {
          100: "var(--info-100)",
          200: "var(--info-200)",
          500: "var(--info-500)",
          600: "var(--info-600)",
        },
        idle: {
          100: "var(--idle-100)",
          200: "var(--idle-200)",
          500: "var(--idle-500)",
          600: "var(--idle-600)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          fg: "var(--sidebar-fg)",
          "fg-dim": "var(--sidebar-fg-dim)",
          hover: "var(--sidebar-hover)",
          active: "var(--sidebar-active)",
          line: "var(--sidebar-line)",
          mark: "var(--sidebar-mark)",
        },
        // Semantic aliases used by shadcn/ui primitives
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        scrim: "var(--scrim)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        // Aliases kept so existing call sites stay valid.
        control: "var(--radius-control)",
        card: "var(--radius-card)",
      },
      boxShadow: {
        // Resting surfaces get no shadow; `overlay` is for floating things.
        overlay: "var(--shadow-overlay)",
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
        display: ["var(--font-rubik)", "var(--font-heebo)", "sans-serif"],
      },
      fontSize: {
        // Type scale — docs/ui/design-system.md §2. Weight and tracking travel
        // with the step so a heading cannot be half-applied. 12px is the floor.
        page: ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.035em", fontWeight: "800" }],
        section: ["1.25rem", { lineHeight: "1.35", fontWeight: "700" }],
        metric: ["1.625rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "800" }],
        identity: ["0.9375rem", { lineHeight: "1.4", fontWeight: "700" }],
        "body-lg": ["1rem", { lineHeight: "1.6" }],
        body: ["0.875rem", { lineHeight: "1.55" }],
        label: ["0.8125rem", { lineHeight: "1.4", fontWeight: "600" }],
        meta: ["0.75rem", { lineHeight: "1.45" }],
      },
      zIndex: {
        nav: "20",
        header: "30",
        bottom: "40",
        overlay: "50",
        toast: "60",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
