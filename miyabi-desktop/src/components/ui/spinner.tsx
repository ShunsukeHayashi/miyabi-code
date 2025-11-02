import * as React from "react"
import { Loader2 } from "lucide-react"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`} {...props}>
      <Loader2 className={`animate-spin text-gray-400 ${sizeClasses[size]}`} strokeWidth={1.5} />
    </div>
  )
}
