import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-light
                    transition-colors duration-default
                    file:border-0 file:bg-transparent file:text-sm file:font-light
                    placeholder:text-gray-400
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2
                    disabled:cursor-not-allowed disabled:opacity-50
                    ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
