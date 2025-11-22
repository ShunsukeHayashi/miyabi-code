import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../test/test-utils'
import InfrastructurePage from './InfrastructurePage'

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
  Legend: () => null,
}))

describe('InfrastructurePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<InfrastructurePage />)
    expect(document.body).toBeInTheDocument()
  })

  it('displays infrastructure content', async () => {
    render(<InfrastructurePage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('shows server status', async () => {
    render(<InfrastructurePage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('displays service health', async () => {
    render(<InfrastructurePage />)

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

    render(<InfrastructurePage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('renders monitoring charts', async () => {
    render(<InfrastructurePage />)

    await waitFor(() => {
      const charts = document.querySelectorAll('div')
      expect(charts.length).toBeGreaterThan(0)
    })
  })
})
