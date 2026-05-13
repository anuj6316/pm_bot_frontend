import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface BadgeProps extends React.ComponentProps<"div"> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning";
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-offset-2",
        {
          "bg-apple-text text-white": variant === "default",
          "bg-black/5 text-apple-text": variant === "secondary",
          "text-apple-text border border-apple-border": variant === "outline",
          "bg-red-500/10 text-red-600": variant === "destructive",
          "bg-green-500/10 text-green-600": variant === "success",
          "bg-orange-500/10 text-orange-600": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
