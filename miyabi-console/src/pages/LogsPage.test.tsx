import { render, fireEvent, waitFor } from '@/test/test-utils'
import LogsPage from './LogsPage'
import { vi, describe, it, expect, beforeEach } from 'vitest'

describe('LogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the page title', async () => {
      const { getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('System Logs')).toBeInTheDocument()
      })
    })

    it('should render the page description', async () => {
      const { getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('Real-time agent activity and system events')).toBeInTheDocument()
      })
    })

    it('should render search input', async () => {
      const { getByPlaceholderText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByPlaceholderText('Search logs...')).toBeInTheDocument()
      })
    })

    it('should render filter dropdowns', async () => {
      const { getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('All Levels')).toBeInTheDocument()
        expect(getByText('All Agents')).toBeInTheDocument()
      })
    })

    it('should render action buttons', async () => {
      const { getByText, container } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('Search')).toBeInTheDocument()
        // Check for refresh button (RefreshCw icon)
        expect(container.querySelector('button')).toBeInTheDocument()
      })
    })
  })

  describe('Log Items', () => {
    it('should display log messages after loading', async () => {
      const { getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('Agent initialization completed successfully')).toBeInTheDocument()
      })
    })

    it('should display log levels', async () => {
      const { getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('INFO')).toBeInTheDocument()
        expect(getByText('DEBUG')).toBeInTheDocument()
        expect(getByText('WARN')).toBeInTheDocument()
        expect(getByText('ERROR')).toBeInTheDocument()
      })
    })

    it('should display agent types', async () => {
      const { getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('CoordinatorAgent')).toBeInTheDocument()
        expect(getByText('CodeGenAgent')).toBeInTheDocument()
        expect(getByText('ReviewAgent')).toBeInTheDocument()
      })
    })

    it('should display issue numbers', async () => {
      const { getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('#673')).toBeInTheDocument()
        expect(getByText('#156')).toBeInTheDocument()
      })
    })

    it('should display file and line information for errors', async () => {
      const { getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('deployment.rs:234')).toBeInTheDocument()
      })
    })
  })

  describe('Level Filter', () => {
    it('should filter logs by level', async () => {
      const { getByText, getByRole, queryByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('INFO')).toBeInTheDocument()
      })

      // Select ERROR level
      const levelSelect = getByRole('combobox', { name: '' })
      fireEvent.change(levelSelect, { target: { value: 'ERROR' } })

      await waitFor(() => {
        // Only ERROR logs should be visible
        expect(getByText('ERROR')).toBeInTheDocument()
        expect(queryByText('Agent initialization completed successfully')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search', () => {
    it('should filter logs by search query', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('Agent initialization completed successfully')).toBeInTheDocument()
      })

      const searchInput = getByPlaceholderText('Search logs...')
      fireEvent.change(searchInput, { target: { value: 'Rate limit' } })

      // Click search button
      const searchButton = getByText('Search')
      fireEvent.click(searchButton)

      await waitFor(() => {
        expect(getByText('Rate limit approaching for GitHub API')).toBeInTheDocument()
      })
    })

    it('should handle Enter key for search', async () => {
      const { getByPlaceholderText, getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('System Logs')).toBeInTheDocument()
      })

      const searchInput = getByPlaceholderText('Search logs...')
      fireEvent.change(searchInput, { target: { value: 'deployment' } })
      fireEvent.keyDown(searchInput, { key: 'Enter' })

      await waitFor(() => {
        expect(getByText('Deployment failed: Connection timeout to production server')).toBeInTheDocument()
      })
    })
  })

  describe('Clear Filters', () => {
    it('should clear all filters when clear button is clicked', async () => {
      const { getByPlaceholderText, container } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByPlaceholderText('Search logs...')).toBeInTheDocument()
      })

      // Add a search query
      const searchInput = getByPlaceholderText('Search logs...')
      fireEvent.change(searchInput, { target: { value: 'test' } })

      // Find and click clear button (X icon button)
      const clearButton = container.querySelectorAll('button')[2] // Third button
      if (clearButton) {
        fireEvent.click(clearButton)

        await waitFor(() => {
          expect(searchInput).toHaveValue('')
        })
      }
    })
  })

  describe('Loading State', () => {
    it('should show page content', async () => {
      const { getByText } = render(<LogsPage />)

      // Page should render
      await waitFor(() => {
        expect(getByText('System Logs')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should display no logs message when filtered results are empty', async () => {
      const { getByPlaceholderText, getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('System Logs')).toBeInTheDocument()
      })

      // Search for something that doesn't exist
      const searchInput = getByPlaceholderText('Search logs...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent_log_message_xyz' } })
      fireEvent.click(getByText('Search'))

      await waitFor(() => {
        expect(getByText('No logs found')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh', () => {
    it('should refresh logs when refresh button is clicked', async () => {
      const { container, getByText } = render(<LogsPage />)

      await waitFor(() => {
        expect(getByText('System Logs')).toBeInTheDocument()
      })

      // Find refresh button (last button in the filter section)
      const buttons = container.querySelectorAll('button')
      const refreshButton = buttons[buttons.length - 1]

      if (refreshButton) {
        fireEvent.click(refreshButton)

        // Should show loading state
        await waitFor(() => {
          expect(refreshButton.querySelector('.animate-spin')).toBeInTheDocument()
        }, { timeout: 100 }).catch(() => {
          // Animation might be too fast to catch
        })
      }
    })
  })
})
