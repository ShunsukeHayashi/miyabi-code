import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../test/test-utils'
import Sidebar from './Sidebar'

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser', avatar_url: 'https://example.com/avatar.png' },
    logout: vi.fn(),
    isAuthenticated: true,
    hasRole: () => true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })
  it('renders without crashing', () => {
    render(<Sidebar />)
    expect(document.body).toBeInTheDocument()
  })

  it('displays navigation links', () => {
    render(<Sidebar />)

    // Check for navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('displays agents link', () => {
    render(<Sidebar />)
    expect(screen.getByText('Agents')).toBeInTheDocument()
  })

  it('displays deployment link', () => {
    render(<Sidebar />)
    expect(screen.getByText('Deployment')).toBeInTheDocument()
  })

  it('displays infrastructure link', () => {
    render(<Sidebar />)
    expect(screen.getByText('Infrastructure')).toBeInTheDocument()
  })

  it('displays database link', () => {
    render(<Sidebar />)
    expect(screen.getByText('Database')).toBeInTheDocument()
  })

  it('has proper navigation structure', () => {
    render(<Sidebar />)

    // Check that links are rendered
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders navigation icons', () => {
    render(<Sidebar />)

    // SVG icons should be present
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })
})
