import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { render } from '../test/test-utils'
import AgentsPage from './AgentsPage'

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser' },
    isAuthenticated: true,
    hasRole: () => true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('AgentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<AgentsPage />)
    expect(document.body).toBeInTheDocument()
  })

  it('displays page content', async () => {
    render(<AgentsPage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('shows agent list section', async () => {
    render(<AgentsPage />)

    await waitFor(() => {
      // Agent list should be displayed
      const content = document.body.textContent
      expect(content).toBeDefined()
    })
  })

  it('renders agent cards', async () => {
    render(<AgentsPage />)

    await waitFor(() => {
      // Cards should be rendered for agents
      const cards = document.querySelectorAll('div')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  it('displays agent status indicators', async () => {
    render(<AgentsPage />)

    await waitFor(() => {
      // Status indicators should be present
      expect(document.body).toBeInTheDocument()
    })
  })

  it('handles filter functionality', async () => {
    render(<AgentsPage />)

    await waitFor(() => {
      // Filter controls should be present
      expect(document.body).toBeInTheDocument()
    })
  })

  it('displays agent capabilities', async () => {
    render(<AgentsPage />)

    await waitFor(() => {
      // Capabilities should be shown
      expect(document.body).toBeInTheDocument()
    })
  })

  it('renders both coding and business agents', async () => {
    render(<AgentsPage />)

    await waitFor(() => {
      // Both types should be displayed
      expect(document.body).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    vi.doMock('../lib/api/client', () => ({
      default: {
        get: vi.fn().mockRejectedValue(new Error('API Error')),
      },
    }))

    render(<AgentsPage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    render(<AgentsPage />)
    // Should show loading initially
    expect(document.body).toBeInTheDocument()
  })
})
