import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Modern activity manager input styling
    return (
      <input
        type={type}
        className={cn(
          // Base styling with activity manager enhancements
          "flex h-11 w-full rounded-xl border-2 border-border/50 bg-surface/30 backdrop-blur-sm px-4 py-3 text-base ring-offset-background transition-all duration-300",
          // File input styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder and text styling
          "placeholder:text-muted-foreground/60 text-foreground font-medium",
          // Focus states with activity manager colors
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--activity-teal))]/50 focus-visible:ring-offset-2 focus-visible:border-[hsl(var(--activity-teal))]/60",
          // Enhanced focus with gradient shadow
          "focus-visible:shadow-lg focus-visible:shadow-[hsl(var(--activity-teal))]/20",
          // Hover states
          "hover:border-[hsl(var(--activity-teal))]/40 hover:bg-surface/50",
          // Disabled states
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/50",
          // Mobile responsiveness
          "md:text-sm md:h-10 md:py-2.5",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
