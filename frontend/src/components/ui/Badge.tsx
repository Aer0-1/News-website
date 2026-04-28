import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "danger" | "success" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
  
  const variants = {
    default: "border-transparent bg-primary-blue text-white hover:bg-primary-blue/80",
    secondary: "border-transparent bg-light-gray text-foreground hover:bg-light-gray/80",
    danger: "border-transparent bg-danger-red text-white hover:bg-danger-red/80",
    success: "border-transparent bg-success-green text-white hover:bg-success-green/80",
    outline: "text-foreground border-foreground/20",
  }

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  )
}

export { Badge }
