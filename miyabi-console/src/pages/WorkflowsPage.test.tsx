import { render, fireEvent, waitFor } from '@/test/test-utils'
import WorkflowsPage from './WorkflowsPage'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  Controls: () => <div data-testid="react-flow-controls" />,
  Background: () => <div data-testid="react-flow-background" />,
  useNodesState: () => [
    [
      { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Test Trigger' } },
    ],
    vi.fn(),
    vi.fn(),
  ],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  addEdge: vi.fn(),
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  BackgroundVariant: { Dots: 'dots' },
}))

describe('WorkflowsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the page title', async () => {
      const { getByText } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getByText('Workflow Automation')).toBeInTheDocument()
      })
    })

    it('should render workflow list after loading', async () => {
      const { getByText } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getByText('CI/CD Pipeline')).toBeInTheDocument()
        expect(getByText('Issue Triage')).toBeInTheDocument()
        expect(getByText('Nightly Build')).toBeInTheDocument()
      })
    })

    it('should render node palette', async () => {
      const { getByText } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getByText('Node Palette')).toBeInTheDocument()
        expect(getByText('Triggers')).toBeInTheDocument()
        expect(getByText('Actions')).toBeInTheDocument()
        expect(getByText('Conditions')).toBeInTheDocument()
      })
    })

    it('should render action buttons', async () => {
      const { getByText } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getByText('New Workflow')).toBeInTheDocument()
        expect(getByText('Save')).toBeInTheDocument()
        expect(getByText('Run')).toBeInTheDocument()
      })
    })

    it('should render React Flow canvas', async () => {
      const { getByTestId } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getByTestId('react-flow')).toBeInTheDocument()
      })
    })
  })

  describe('Workflow List', () => {
    it('should display workflow status chips', async () => {
      const { getAllByText, getByText } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getAllByText('Active').length).toBeGreaterThan(0)
        expect(getByText('Disabled')).toBeInTheDocument()
      })
    })

    it('should display workflow descriptions', async () => {
      const { getByText } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getByText('Run tests and deploy on PR merge')).toBeInTheDocument()
        expect(getByText('Auto-label and assign issues')).toBeInTheDocument()
      })
    })
  })

  describe('Node Palette', () => {
    it('should display trigger node options', async () => {
      const { getByText } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getByText('GitHub PR Created')).toBeInTheDocument()
        expect(getByText('Schedule (Cron)')).toBeInTheDocument()
        expect(getByText('Webhook')).toBeInTheDocument()
        expect(getByText('Manual Trigger')).toBeInTheDocument()
      })
    })

    it('should display action node options', async () => {
      const { getByText } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getByText('Run Tests')).toBeInTheDocument()
        expect(getByText('Deploy')).toBeInTheDocument()
        expect(getByText('Send Notification')).toBeInTheDocument()
        expect(getByText('Create Issue')).toBeInTheDocument()
        expect(getByText('Assign to Agent')).toBeInTheDocument()
      })
    })

    it('should display condition node options', async () => {
      const { getByText } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getByText('If/Else')).toBeInTheDocument()
        expect(getByText('Switch')).toBeInTheDocument()
      })
    })
  })

  describe('Modals', () => {
    it('should open new workflow modal when clicking New Workflow button', async () => {
      const { getByText, findByText } = render(<WorkflowsPage />)

      await waitFor(() => {
        expect(getByText('New Workflow')).toBeInTheDocument()
      })

      fireEvent.click(getByText('New Workflow'))

      expect(await findByText('Create New Workflow')).toBeInTheDocument()
      expect(await findByText('Workflow Name')).toBeInTheDocument()
      expect(await findByText('Description')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should transition from loading to loaded state', async () => {
      const { getByText } = render(<WorkflowsPage />)

      // After loading, workflows should be displayed
      await waitFor(() => {
        expect(getByText('Workflows')).toBeInTheDocument()
      })
    })
  })
})
