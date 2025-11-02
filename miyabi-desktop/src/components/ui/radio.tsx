import * as React from "react"

export interface RadioProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          className={`h-4 w-4 border-gray-300 text-gray-900
                      transition-colors duration-default
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2
                      disabled:cursor-not-allowed disabled:opacity-50
                      ${className}`}
          ref={ref}
          {...props}
        />
        {label && <span className="text-sm font-light text-gray-900">{label}</span>}
      </label>
    )
  }
)
Radio.displayName = "Radio"

export { Radio }
