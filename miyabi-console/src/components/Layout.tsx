import { Outlet, Link, useLocation } from 'react-router-dom'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button } from '@heroui/react'

export default function Layout() {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Agents', path: '/agents' },
    { name: 'Deployment', path: '/deployment' },
    { name: 'Infrastructure', path: '/infrastructure' },
    { name: 'Database', path: '/database' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar isBordered maxWidth="full">
        <NavbarBrand>
          <p className="font-bold text-inherit">Miyabi Console</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {navItems.map((item) => (
            <NavbarItem key={item.path} isActive={location.pathname === item.path}>
              <Link
                to={item.path}
                className={
                  location.pathname === item.path
                    ? 'text-primary font-semibold'
                    : 'text-foreground'
                }
              >
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button as={Link} color="primary" to="/settings" variant="flat">
              Settings
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Outlet />
      </main>
    </div>
  )
}
