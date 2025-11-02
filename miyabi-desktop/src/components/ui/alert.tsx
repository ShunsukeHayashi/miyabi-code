import * as React from "react"
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error"
}

const variantStyles = {
  default: "border-gray-200 bg-gray-50 text-gray-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-orange-200 bg-orange-50 text-orange-900",
  error: "border-red-200 bg-red-50 text-red-900",
}

const variantIcons = {
  default: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
}

export function Alert({ variant = "default", className, children, ...props }: AlertProps) {
  const Icon = variantIcons[variant]

  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-xl border p-4 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function AlertTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={`mb-1 font-normal ${className}`} {...props}>
      {children}
    </h5>
  )
}

export function AlertDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div className={`text-sm font-light opacity-90 ${className}`} {...props}>
      {children}
    </div>
  )
}
