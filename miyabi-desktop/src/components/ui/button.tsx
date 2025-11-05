import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50"

    const variants = {
      default: "bg-brand-primary text-white shadow-brand-xs hover:bg-brand-primary/90",
      destructive: "bg-brand-danger text-white shadow-brand-xs hover:bg-brand-danger/90",
      outline:
        "border border-border bg-transparent text-brand-text-primary hover:bg-brand-primary-soft",
      secondary:
        "bg-brand-surface text-brand-text-primary shadow-brand-xs hover:bg-white hover:shadow-brand-sm",
      ghost: "text-brand-text-secondary hover:bg-brand-primary-soft hover:text-brand-text-primary",
      link: "text-brand-primary underline-offset-4 hover:underline"
    }

    const sizes = {
      default: "h-10 px-4",
      sm: "h-9 px-3 text-sm",
      lg: "h-11 px-5 text-base",
      icon: "h-10 w-10"
    }

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
