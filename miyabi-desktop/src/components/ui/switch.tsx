import * as React from "react"

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, checked, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="relative inline-block w-11 h-6">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            ref={ref}
            {...props}
          />
          <div className={`w-11 h-6 bg-gray-200 rounded-full peer
                          peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900 peer-focus-visible:ring-offset-2
                          peer-checked:bg-gray-900
                          peer-disabled:cursor-not-allowed peer-disabled:opacity-50
                          transition-colors duration-default
                          ${className}`}></div>
          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full
                          transition-transform duration-default
                          peer-checked:translate-x-5`}></div>
        </div>
        {label && <span className="text-sm font-light text-gray-900">{label}</span>}
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
