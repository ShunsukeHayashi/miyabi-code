import * as React from "react"
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error"
}

const variantStyles = {
  default: "border-border bg-brand-primary-soft text-brand-text-primary",
  success: "border-brand-success/30 bg-brand-success/10 text-brand-success",
  warning: "border-brand-warning/30 bg-brand-warning/10 text-brand-warning",
  error: "border-brand-danger/30 bg-brand-danger/10 text-brand-danger",
} satisfies Record<NonNullable<AlertProps["variant"]>, string>

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
      className={`flex gap-3 rounded-lg border p-4 shadow-brand-xs ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
      <div className="flex-1">{children}</div>
    </div>
  )
}

export function AlertTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={`mb-1 font-medium text-body ${className}`} {...props}>
      {children}
    </h5>
  )
}

export function AlertDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div className={`text-body-sm font-light text-brand-text-secondary ${className}`} {...props}>
      {children}
    </div>
  )
}
