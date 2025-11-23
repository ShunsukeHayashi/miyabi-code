import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
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
    <div className="min-h-screen bg-white">
      {/* Minimal Header - Ive Style */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="flex items-center justify-between h-20">
            {/* Brand - Ultra Minimal */}
            <Link to="/" className="flex items-center space-x-3">
              <span className="text-2xl font-extralight tracking-tight text-gray-900">
                Miyabi
              </span>
            </Link>

            {/* Desktop Navigation - Text Only */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-base font-light tracking-tight transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'text-gray-900 border-b-2 border-gray-900 pb-1'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Profile - Desktop */}
            <div className="hidden lg:block">
              <UserProfile />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu - Minimal Slide Down */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="container mx-auto px-8 py-6 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block text-lg font-light transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200">
                <UserProfile />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Generous Padding */}
      <main className="container mx-auto px-8 py-16 max-w-7xl">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-200 mt-24">
        <div className="container mx-auto px-8 py-12 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <p className="text-sm font-light text-gray-500">
              © 2025 Miyabi. All rights reserved.
            </p>
            <div className="flex items-center gap-8">
              <Link
                to="/docs"
                className="text-sm font-light text-gray-500 hover:text-gray-900 transition-colors duration-200"
              >
                Documentation
              </Link>
              <Link
                to="/support"
                className="text-sm font-light text-gray-500 hover:text-gray-900 transition-colors duration-200"
              >
                Support
              </Link>
              <Link
                to="/settings"
                className="text-sm font-light text-gray-500 hover:text-gray-900 transition-colors duration-200"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
