import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-mauve-700",
        outline:
          "border border-line-strong bg-surface text-ink hover:bg-mauve-100 hover:text-ink",
        ghost: "text-ink hover:bg-mauve-100",
        /** Tinted brand button: quieter than primary, still clearly an action. */
        soft: "border border-mauve-200 bg-mauve-100 text-mauve-600 hover:bg-mauve-200",
        /** Destructive *trigger* sitting in context -- reads as a warning, not an alarm. */
        "danger-soft":
          "border border-danger-200 bg-danger-100 text-danger-600 hover:bg-danger-200",
        /** Destructive *confirm* inside an AlertDialog -- solid, unmistakable. */
        danger: "bg-danger-600 text-white hover:bg-danger-600/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[39px] px-4 py-2",
        /** The page's one primary action stands slightly taller. */
        primary: "h-[41px] px-5",
        sm: "h-[35px] px-3",
        /** Tablet/worker-facing minimum touch target. */
        lg: "h-11 px-6",
        icon: "h-[39px] w-[39px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
