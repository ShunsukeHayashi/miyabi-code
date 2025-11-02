import * as React from "react"
import { createPortal } from "react-dom"

export interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: "left" | "right" | "top" | "bottom"
  children: React.ReactNode
}

export function Sheet({ open, onOpenChange, side = "right", children }: SheetProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange?.(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, onOpenChange])

  if (!open) return null

  const sideClasses = {
    right: "right-0 top-0 h-full w-96 slide-in-from-right",
    left: "left-0 top-0 h-full w-96 slide-in-from-left",
    top: "top-0 left-0 w-full h-96 slide-in-from-top",
    bottom: "bottom-0 left-0 w-full h-96 slide-in-from-bottom",
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-default"
        onClick={() => onOpenChange?.(false)}
      />
      {/* Sheet Content */}
      <div className={`fixed bg-white shadow-2xl transition-transform duration-default ${sideClasses[side]}`}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export function SheetContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`h-full flex flex-col ${className}`} {...props}>
      {children}
    </div>
  )
}

export function SheetHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col space-y-2 p-6 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function SheetTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={`text-xl font-light text-gray-900 ${className}`} {...props}>
      {children}
    </h2>
  )
}

export function SheetDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm font-light text-gray-500 ${className}`} {...props}>
      {children}
    </p>
  )
}

export function SheetBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex-1 overflow-y-auto p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function SheetFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-end gap-2 p-6 border-t border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  )
}
