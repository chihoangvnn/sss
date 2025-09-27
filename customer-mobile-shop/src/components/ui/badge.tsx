import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-green-600 text-white",
        secondary: 
          "border-transparent bg-gray-100 text-gray-900",
        destructive:
          "border-transparent bg-red-600 text-white",
        outline: 
          "border-gray-300 text-gray-900",
        // Product badge variants
        new:
          "border-transparent bg-green-500 text-white",
        topseller:
          "border-transparent bg-orange-500 text-white",
        freeshipping:
          "border-transparent bg-blue-500 text-white",
        bestseller:
          "border-transparent bg-purple-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }