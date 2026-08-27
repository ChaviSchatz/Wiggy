import * as React from "react";

import { cn } from "@/lib/utils";
import { CONTROL_FOCUS, CONTROL_FRAME, CONTROL_HEIGHT } from "./control";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex px-3 py-2",
      CONTROL_FRAME,
      CONTROL_HEIGHT,
      CONTROL_FOCUS,
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
