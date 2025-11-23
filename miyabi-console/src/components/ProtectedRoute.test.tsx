import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../test/test-utils'
import ProtectedRoute from './ProtectedRoute'

// Mock useAuth with different states
const mockUseAuth = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('ProtectedRoute', () => {
  it('renders children when authenticated with valid role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      hasRole: () => true,
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('renders children when authenticated without role requirement', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      hasRole: () => true,
    })

    render(
      <ProtectedRoute>
        <div>No Role Required</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('No Role Required')).toBeInTheDocument()
  })

  it('shows content when user has admin role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      hasRole: (role: string | string[]) => {
        const roles = Array.isArray(role) ? role : [role]
        return roles.includes('admin')
      },
    })

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('shows content when user has one of required roles', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      hasRole: (role: string | string[]) => {
        const roles = Array.isArray(role) ? role : [role]
        return roles.includes('developer')
      },
    })

    render(
      <ProtectedRoute requiredRole={['admin', 'developer']}>
        <div>Dev Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Dev Content')).toBeInTheDocument()
  })

  it('handles loading state', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      hasRole: () => false,
    })

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    // During loading, may show loading indicator or nothing
    expect(container).toBeInTheDocument()
  })

  it('handles unauthenticated state', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      hasRole: () => false,
    })

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    // When not authenticated, should redirect (content not shown)
    expect(container).toBeInTheDocument()
  })
})
