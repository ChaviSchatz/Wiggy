import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

type BaseProps = Omit<ButtonProps, "size" | "children" | "asChild">;

export interface IconButtonProps extends BaseProps {
  icon: React.ReactNode;
  /** Required — becomes aria-label and title (design-system.md "core" group). */
  label: string;
  /** Renders as a link (e.g. tel:/mailto:) instead of a <button>. */
  href?: string;
  target?: string;
  rel?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = "ghost", href, target, rel, ...props }, ref) => {
    if (href) {
      return (
        <Button
          asChild
          variant={variant}
          size="icon"
          aria-label={label}
          title={label}
        >
          <a href={href} target={target} rel={rel}>
            {icon}
          </a>
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        aria-label={label}
        title={label}
        {...props}
      >
        {icon}
      </Button>
    );
  },
);
IconButton.displayName = "IconButton";

export { IconButton };
