import * as React from "react";

import { cn } from "@/lib/utils";
import { CONTROL_FOCUS, CONTROL_FRAME } from "./control";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-20 px-3 py-2",
      CONTROL_FRAME,
      CONTROL_FOCUS,
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
