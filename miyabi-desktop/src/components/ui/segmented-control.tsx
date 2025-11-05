import * as React from "react"
import clsx from "clsx"

export interface SegmentedControlOption<T extends string | number> {
  label: string
  value: T
  icon?: React.ReactNode
}

export interface SegmentedControlProps<T extends string | number> {
  options: readonly SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SegmentedControlProps<T>) {
  const optionRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const focusOption = React.useCallback(
    (index: number) => {
      const option = optionRefs.current[index]
      option?.focus()
    },
    [optionRefs]
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.altKey || event.metaKey || event.ctrlKey) return

    let nextIndex = index
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault()
      nextIndex = (index + 1) % options.length
      focusOption(nextIndex)
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault()
      nextIndex = (index - 1 + options.length) % options.length
      focusOption(nextIndex)
    } else if (event.key === "Home") {
      event.preventDefault()
      focusOption(0)
    } else if (event.key === "End") {
      event.preventDefault()
      focusOption(options.length - 1)
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault()
      onChange(options[index].value)
    }
  }

  return (
    <div
      role="radiogroup"
      className={clsx(
        "inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-inner",
        className
      )}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {options.map((option, index) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            ref={(node) => {
              optionRefs.current[index] = node
            }}
            role="radio"
            type="button"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onClick={() => onChange(option.value)}
            className={clsx(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
              isActive
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            )}
          >
            {option.icon && <span className="flex h-4 w-4 items-center justify-center">{option.icon}</span>}
            <span className="capitalize">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
