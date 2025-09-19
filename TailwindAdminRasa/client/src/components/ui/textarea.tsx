import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Base styling with activity manager enhancements  
        "flex min-h-[100px] w-full rounded-xl border-2 border-border/50 bg-surface/30 backdrop-blur-sm px-4 py-3 text-base ring-offset-background transition-all duration-300 resize-vertical",
        // Placeholder and text styling
        "placeholder:text-muted-foreground/60 text-foreground font-medium leading-relaxed",
        // Focus states with activity manager colors
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--activity-purple))]/50 focus-visible:ring-offset-2 focus-visible:border-[hsl(var(--activity-purple))]/60",
        // Enhanced focus with gradient shadow
        "focus-visible:shadow-lg focus-visible:shadow-[hsl(var(--activity-purple))]/20",
        // Hover states
        "hover:border-[hsl(var(--activity-purple))]/40 hover:bg-surface/50",
        // Disabled states
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/50",
        // Mobile responsiveness
        "md:text-sm md:min-h-[80px] md:py-2.5",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }