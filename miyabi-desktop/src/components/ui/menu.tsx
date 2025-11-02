import * as React from "react"
import { createPortal } from "react-dom"

export interface MenuProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  position: { x: number; y: number }
}

export function Menu({ children, open, onOpenChange, position }: MenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
      className="z-50 min-w-[12rem] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
    >
      {children}
    </div>,
    document.body
  )
}

export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  shortcut?: string
  destructive?: boolean
}

export function MenuItem({ icon, shortcut, destructive = false, className, children, ...props }: MenuItemProps) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-light rounded-lg
                  transition-colors duration-default
                  focus:outline-none focus:bg-gray-100
                  hover:bg-gray-100
                  ${destructive ? "text-red-600" : "text-gray-900"}
                  ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && (
        <span className="flex-shrink-0 text-xs font-light text-gray-500">{shortcut}</span>
      )}
    </button>
  )
}

export function MenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`-mx-1 my-1 h-px bg-gray-200 ${className}`}
      role="separator"
      {...props}
    />
  )
}

export function MenuLabel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-3 py-2 text-xs font-normal text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export interface UseContextMenuReturn {
  position: { x: number; y: number }
  open: boolean
  onOpenChange: (open: boolean) => void
  onContextMenu: (event: React.MouseEvent) => void
}

export function useContextMenu(): UseContextMenuReturn {
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [open, setOpen] = React.useState(false)

  const onContextMenu = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setPosition({ x: event.clientX, y: event.clientY })
    setOpen(true)
  }, [])

  return {
    position,
    open,
    onOpenChange: setOpen,
    onContextMenu,
  }
}
