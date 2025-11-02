import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"

export interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
}

export function Dropdown({ trigger, children, align = "left" }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 4,
        left: align === "left" ? rect.left : rect.right,
      })
    }
  }, [open, align])

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={contentRef}
            style={{
              position: "fixed",
              top: `${position.top}px`,
              left: align === "left" ? `${position.left}px` : "auto",
              right: align === "right" ? `${window.innerWidth - position.left}px` : "auto",
            }}
            className="z-50 min-w-[12rem] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
          >
            {children}
          </div>,
          document.body
        )}
    </>
  )
}

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean
}

export function DropdownItem({ destructive = false, className, children, ...props }: DropdownItemProps) {
  return (
    <button
      className={`w-full text-left px-3 py-2 text-sm font-light rounded-lg
                  transition-colors duration-default
                  focus:outline-none focus:bg-gray-100
                  hover:bg-gray-100
                  ${destructive ? "text-red-600" : "text-gray-900"}
                  ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`-mx-1 my-1 h-px bg-gray-200 ${className}`}
      role="separator"
      {...props}
    />
  )
}

export function DropdownLabel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-3 py-2 text-xs font-normal text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
