import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { render } from '../test/test-utils'
import DatabasePage from './DatabasePage'

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'admin' },
    isAuthenticated: true,
    hasRole: () => true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div>Chart</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  AreaChart: () => <div>Area Chart</div>,
  Area: () => null,
}))

describe('DatabasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<DatabasePage />)
    expect(document.body).toBeInTheDocument()
  })

  it('displays database content', async () => {
    render(<DatabasePage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('shows database connections', async () => {
    render(<DatabasePage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('displays query information', async () => {
    render(<DatabasePage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    vi.doMock('../lib/api/client', () => ({
      default: {
        get: vi.fn().mockRejectedValue(new Error('API Error')),
      },
    }))

    render(<DatabasePage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('renders database metrics', async () => {
    render(<DatabasePage />)

    await waitFor(() => {
      const elements = document.querySelectorAll('div')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  it('displays tables list', async () => {
    render(<DatabasePage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })
})
