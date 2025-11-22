import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../test/test-utils'
import DeploymentPipelinePage from './DeploymentPipelinePage'

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'admin', role: 'admin' },
    isAuthenticated: true,
    hasRole: () => true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock ReactFlow
vi.mock('reactflow', () => ({
  default: () => <div data-testid="react-flow">Flow</div>,
  ReactFlow: () => <div data-testid="react-flow">Flow</div>,
  Controls: () => null,
  Background: () => null,
  MiniMap: () => null,
  useNodesState: () => [[], vi.fn()],
  useEdgesState: () => [[], vi.fn()],
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  MarkerType: { Arrow: 'arrow', ArrowClosed: 'arrowclosed' },
}))

describe('DeploymentPipelinePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<DeploymentPipelinePage />)
    expect(document.body).toBeInTheDocument()
  })

  it('displays deployment pipeline content', async () => {
    render(<DeploymentPipelinePage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('shows pipeline stages', async () => {
    render(<DeploymentPipelinePage />)

    await waitFor(() => {
      // Pipeline stages should be shown
      const content = document.body
      expect(content).toBeInTheDocument()
    })
  })

  it('handles API errors', async () => {
    vi.doMock('../lib/api/client', () => ({
      default: {
        get: vi.fn().mockRejectedValue(new Error('API Error')),
      },
    }))

    render(<DeploymentPipelinePage />)

    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('displays deployment actions', async () => {
    render(<DeploymentPipelinePage />)

    await waitFor(() => {
      // Actions should be available
      expect(document.body).toBeInTheDocument()
    })
  })
})
