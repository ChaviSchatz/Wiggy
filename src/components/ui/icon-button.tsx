import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BaseProps = Omit<ButtonProps, "size" | "children" | "asChild">;


export interface IconButtonProps extends BaseProps {
  icon: React.ReactNode;
  /** Required — becomes aria-label and title (design-system.md "core" group). */
  label: string;
  /** 32px instead of the standard control height — for table rows and other
   * dense surfaces, where a full-height control would dominate the row. */
  dense?: boolean;
  /** Renders as a link (e.g. tel:/mailto:) instead of a <button>. */
  href?: string;
  target?: string;
  rel?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon, label, variant = "ghost", dense, className, href, target, rel, ...props },
    ref,
  ) => {
    const classes = cn(dense && "size-8", className);

    if (href) {
      return (
        <Button
          asChild
          variant={variant}
          size="icon"
          className={classes}
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
        className={classes}
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
