import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-apple-blue text-white hover:bg-apple-blue-hover shadow-sm": variant === "default",
            "border border-apple-border bg-transparent hover:bg-black/5 text-apple-text": variant === "outline",
            "hover:bg-black/5 text-apple-text": variant === "ghost",
            "bg-black/5 text-apple-text hover:bg-black/10": variant === "secondary",
            "h-10 px-4 py-2": size === "default",
            "h-8 rounded-full px-3 text-xs": size === "sm",
            "h-12 rounded-full px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
