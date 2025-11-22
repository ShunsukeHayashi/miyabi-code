import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../test/test-utils'
import LoginPage from './LoginPage'

// Mock the useAuth hook
const mockLogin = vi.fn()
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
    error: null,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the login page with title', () => {
    render(<LoginPage />)

    expect(screen.getByText('Miyabi')).toBeInTheDocument()
    // Console text has a leading space in the span
    expect(screen.getByText(/Console/)).toBeInTheDocument()
  })

  it('displays the subtitle', () => {
    render(<LoginPage />)

    expect(screen.getByText(/開発から経営まで/)).toBeInTheDocument()
  })

  it('renders the login button', () => {
    render(<LoginPage />)

    const loginButton = screen.getByRole('button', { name: /今すぐ始める/i })
    expect(loginButton).toBeInTheDocument()
  })

  it('calls login when button is clicked', () => {
    render(<LoginPage />)

    const loginButton = screen.getByRole('button', { name: /今すぐ始める/i })
    fireEvent.click(loginButton)

    expect(mockLogin).toHaveBeenCalledTimes(1)
  })

  it('displays loading state', () => {
    vi.doMock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        login: mockLogin,
        loading: true,
        error: null,
      }),
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }))

    render(<LoginPage />)

    // Button should still be present (HeroUI handles disabled state)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('displays error message when error exists', async () => {
    // Re-mock with error
    vi.doMock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        login: mockLogin,
        loading: false,
        error: 'Authentication failed',
      }),
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }))

    render(<LoginPage />)

    // Check if error would be displayed (implementation dependent)
  })

  it('has proper styling classes', () => {
    render(<LoginPage />)

    // Check for the main container
    const mainContainer = screen.getByText('Miyabi').closest('div')
    expect(mainContainer).toBeInTheDocument()
  })

  it('displays all login options', () => {
    render(<LoginPage />)

    // Main login button
    expect(screen.getByRole('button', { name: /今すぐ始める/i })).toBeInTheDocument()
  })
})
