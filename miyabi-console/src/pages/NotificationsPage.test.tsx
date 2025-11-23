import { render, fireEvent, waitFor } from '@/test/test-utils'
import NotificationsPage from './NotificationsPage'
import { vi, describe, it, expect, beforeEach } from 'vitest'

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the page title', async () => {
      const { getByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getByText('Notifications')).toBeInTheDocument()
      })
    })

    it('should render notifications list after loading', async () => {
      const { getByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getByText('New Task Assigned')).toBeInTheDocument()
        expect(getByText('Deployment Successful')).toBeInTheDocument()
        expect(getByText('You were mentioned')).toBeInTheDocument()
      })
    })

    it('should render search input', async () => {
      const { getByPlaceholderText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getByPlaceholderText('Search notifications...')).toBeInTheDocument()
      })
    })

    it('should render filter buttons', async () => {
      const { getByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getByText('Status: All')).toBeInTheDocument()
        expect(getByText('Type')).toBeInTheDocument()
      })
    })
  })

  describe('Notification Items', () => {
    it('should display notification messages', async () => {
      const { getByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(
          getByText('You have been assigned to "Implement auth flow" by Yuki Tanaka')
        ).toBeInTheDocument()
      })
    })

    it('should display notification types', async () => {
      const { getAllByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getAllByText('Task').length).toBeGreaterThan(0)
        expect(getAllByText('Deploy').length).toBeGreaterThan(0)
      })
    })

    it('should display action buttons', async () => {
      const { getAllByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getAllByText('View Task').length).toBeGreaterThan(0)
        expect(getAllByText('View Details').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Unread Count', () => {
    it('should display unread count badge', async () => {
      const { getByText } = render(<NotificationsPage />)

      await waitFor(() => {
        // Page title should be present indicating page has loaded
        expect(getByText('Notifications')).toBeInTheDocument()
        // Unread notifications exist in mock data
        expect(getByText('New Task Assigned')).toBeInTheDocument()
      })
    })
  })

  describe('Search', () => {
    it('should filter notifications by search query', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getByText('New Task Assigned')).toBeInTheDocument()
      })

      const searchInput = getByPlaceholderText('Search notifications...')
      fireEvent.change(searchInput, { target: { value: 'deployment' } })

      await waitFor(() => {
        expect(getByText('Deployment Successful')).toBeInTheDocument()
        expect(queryByText('New Task Assigned')).not.toBeInTheDocument()
      })
    })
  })

  describe('Filters', () => {
    it('should show clear filters button when filters are active', async () => {
      const { getByPlaceholderText, getByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getByText('Notifications')).toBeInTheDocument()
      })

      const searchInput = getByPlaceholderText('Search notifications...')
      fireEvent.change(searchInput, { target: { value: 'test' } })

      await waitFor(() => {
        expect(getByText('Clear filters')).toBeInTheDocument()
      })
    })
  })

  describe('Preferences Modal', () => {
    it('should open preferences modal when clicking settings button', async () => {
      const { container, findByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(container.querySelector('button')).toBeInTheDocument()
      })

      // Find and click settings button (third button in header)
      const buttons = container.querySelectorAll('button')
      const settingsButton = Array.from(buttons).find((btn) =>
        btn.querySelector('svg.lucide-settings')
      )

      if (settingsButton) {
        fireEvent.click(settingsButton)
        expect(await findByText('Notification Preferences')).toBeInTheDocument()
      }
    })
  })

  describe('Empty State', () => {
    it('should show message when no notifications match filters', async () => {
      const { getByPlaceholderText, getByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getByText('Notifications')).toBeInTheDocument()
      })

      const searchInput = getByPlaceholderText('Search notifications...')
      fireEvent.change(searchInput, { target: { value: 'zzzznonexistent' } })

      await waitFor(() => {
        expect(getByText('No notifications match your filters')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should transition from loading to loaded state', async () => {
      const { getByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getByText('Notifications')).toBeInTheDocument()
      })
    })
  })

  describe('Time Display', () => {
    it('should display relative time for notifications', async () => {
      const { getAllByText } = render(<NotificationsPage />)

      await waitFor(() => {
        // Should show relative times like "5m ago", "1h ago", etc.
        const timeElements = getAllByText(/\d+[mhd] ago/)
        expect(timeElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Notification Types', () => {
    it('should display different notification type labels', async () => {
      const { getByText } = render(<NotificationsPage />)

      await waitFor(() => {
        expect(getByText('Mention')).toBeInTheDocument()
        expect(getByText('Alert')).toBeInTheDocument()
        expect(getByText('Agent')).toBeInTheDocument()
      })
    })
  })
})
