import * as React from "react"

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  variant?: "default" | "bordered" | "divided"
}

const variantStyles = {
  default: "",
  bordered: "border border-gray-200 rounded-xl",
  divided: "divide-y divide-gray-200 border border-gray-200 rounded-xl",
}

export function List({ variant = "default", className, ...props }: ListProps) {
  return (
    <ul
      className={`${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  interactive?: boolean
}

export function ListItem({ interactive = false, className, ...props }: ListItemProps) {
  return (
    <li
      className={`px-4 py-3 text-sm font-light
                  ${interactive ? "cursor-pointer transition-colors duration-default hover:bg-gray-50" : ""}
                  ${className}`}
      {...props}
    />
  )
}

export function ListItemTitle({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`font-normal text-gray-900 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function ListItemDescription({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-sm font-light text-gray-600 mt-1 ${className}`} {...props}>
      {children}
    </div>
  )
}
