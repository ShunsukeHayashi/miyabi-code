import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Button
} from '@heroui/react'
import UserProfile from './UserProfile'

export default function Layout() {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Agents', path: '/agents' },
    { name: 'Deployment', path: '/deployment' },
    { name: 'Infrastructure', path: '/infrastructure' },
    { name: 'Database', path: '/database' },
    { name: 'Dynamic UI', path: '/dynamic' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        isBordered
        maxWidth="full"
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
      >
        {/* Mobile Menu Toggle - Only visible on mobile */}
        <NavbarContent className="sm:hidden" justify="start">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          />
        </NavbarContent>

        {/* Brand - Centered on mobile, left on desktop */}
        <NavbarContent className="sm:hidden pr-3" justify="center">
          <NavbarBrand>
            <p className="font-light tracking-tight text-inherit">
              <span className="text-blue-600">Miyabi</span>
            </p>
          </NavbarBrand>
        </NavbarContent>

        {/* Brand - Desktop only */}
        <NavbarBrand className="hidden sm:flex">
          <p className="font-light tracking-tight text-inherit">
            <span className="text-blue-600">Miyabi</span> Console
          </p>
        </NavbarBrand>

        {/* Desktop Navigation */}
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {navItems.map((item) => (
            <NavbarItem key={item.path} isActive={location.pathname === item.path}>
              <Link
                to={item.path}
                className={
                  location.pathname === item.path
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-blue-600 transition-colors duration-200'
                }
              >
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        {/* User Profile - Desktop */}
        <NavbarContent className="hidden sm:flex" justify="end">
          <NavbarItem>
            <UserProfile />
          </NavbarItem>
        </NavbarContent>

        {/* Mobile Menu */}
        <NavbarMenu>
          {navItems.map((item, index) => (
            <NavbarMenuItem key={item.path + '-' + index}>
              <Link
                to={item.path}
                className={'w-full ' + (
                  location.pathname === item.path
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-600'
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem>
            <Link
              to="/settings"
              className="w-full text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Settings
            </Link>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Outlet />
      </main>
    </div>
  )
}
