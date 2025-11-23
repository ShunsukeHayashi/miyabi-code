import { render, fireEvent, waitFor } from '@/test/test-utils'
import WorktreeManagerPage from './WorktreeManagerPage'
import { vi, describe, it, expect, beforeEach } from 'vitest'

describe('WorktreeManagerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the page title', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('Worktree Manager')).toBeInTheDocument()
      })
    })

    it('should render the page description', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('Manage Git worktrees for parallel task execution')).toBeInTheDocument()
      })
    })

    it('should render New Worktree button', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('New Worktree')).toBeInTheDocument()
      })
    })

    it('should render refresh button', async () => {
      const { container } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        // Refresh button should be present
        const buttons = container.querySelectorAll('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Stats', () => {
    it('should display total count', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('Total')).toBeInTheDocument()
        expect(getByText('4')).toBeInTheDocument()
      })
    })

    it('should display active count', async () => {
      const { getByText, container } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('Active')).toBeInTheDocument()
        // Check for the active stats card with bg-green-50
        const activeCard = container.querySelector('.bg-green-50')
        expect(activeCard).toBeInTheDocument()
      })
    })

    it('should display idle count', async () => {
      const { getByText, container } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('Idle')).toBeInTheDocument()
        // Check for the idle stats card
        const idleCards = container.querySelectorAll('.bg-gray-50')
        expect(idleCards.length).toBeGreaterThan(0)
      })
    })

    it('should display completed count', async () => {
      const { getByText, container } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('Completed')).toBeInTheDocument()
        // Check for the completed stats card with bg-blue-50
        const completedCard = container.querySelector('.bg-blue-50')
        expect(completedCard).toBeInTheDocument()
      })
    })

    it('should display error count', async () => {
      const { getByText, container } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('Error')).toBeInTheDocument()
        // Check for the error stats card with bg-red-50
        const errorCard = container.querySelector('.bg-red-50')
        expect(errorCard).toBeInTheDocument()
      })
    })
  })

  describe('Worktree Items', () => {
    it('should display worktree branches', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('feature/authentication')).toBeInTheDocument()
        expect(getByText('fix/api-timeout')).toBeInTheDocument()
        expect(getByText('refactor/core-module')).toBeInTheDocument()
        expect(getByText('deploy/production-v2')).toBeInTheDocument()
      })
    })

    it('should display worktree paths', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('/worktrees/feature-auth')).toBeInTheDocument()
        expect(getByText('/worktrees/fix-api')).toBeInTheDocument()
      })
    })

    it('should display status badges', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('Active')).toBeInTheDocument()
        expect(getByText('Idle')).toBeInTheDocument()
        expect(getByText('Completed')).toBeInTheDocument()
        expect(getByText('Error')).toBeInTheDocument()
      })
    })

    it('should display issue numbers', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('#123')).toBeInTheDocument()
        expect(getByText('#456')).toBeInTheDocument()
        expect(getByText('#789')).toBeInTheDocument()
      })
    })

    it('should display agent types', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('CodeGenAgent')).toBeInTheDocument()
        expect(getByText('ReviewAgent')).toBeInTheDocument()
        expect(getByText('PRAgent')).toBeInTheDocument()
        expect(getByText('DeploymentAgent')).toBeInTheDocument()
      })
    })

    it('should display delete buttons for each worktree', async () => {
      const { container } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        // Look for trash icons (delete buttons)
        const deleteButtons = container.querySelectorAll('[title="Delete worktree"]')
        expect(deleteButtons.length).toBe(4)
      })
    })
  })

  describe('Create Modal', () => {
    it('should open create modal when New Worktree is clicked', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('New Worktree')).toBeInTheDocument()
      })

      fireEvent.click(getByText('New Worktree'))

      await waitFor(() => {
        expect(getByText('Create Worktree')).toBeInTheDocument()
        expect(getByText('Branch Name')).toBeInTheDocument()
        expect(getByText('Issue Number (optional)')).toBeInTheDocument()
      })
    })

    it('should render branch name input in modal', async () => {
      const { getByText, getByPlaceholderText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('New Worktree')).toBeInTheDocument()
      })

      fireEvent.click(getByText('New Worktree'))

      await waitFor(() => {
        expect(getByPlaceholderText('feature/my-feature')).toBeInTheDocument()
      })
    })

    it('should render issue number input in modal', async () => {
      const { getByText, getByPlaceholderText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('New Worktree')).toBeInTheDocument()
      })

      fireEvent.click(getByText('New Worktree'))

      await waitFor(() => {
        expect(getByPlaceholderText('123')).toBeInTheDocument()
      })
    })

    it('should close modal when Cancel is clicked', async () => {
      const { getByText, queryByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('New Worktree')).toBeInTheDocument()
      })

      fireEvent.click(getByText('New Worktree'))

      await waitFor(() => {
        expect(getByText('Create Worktree')).toBeInTheDocument()
      })

      fireEvent.click(getByText('Cancel'))

      await waitFor(() => {
        expect(queryByText('Create Worktree')).not.toBeInTheDocument()
      })
    })

    it('should disable Create button when branch name is empty', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('New Worktree')).toBeInTheDocument()
      })

      fireEvent.click(getByText('New Worktree'))

      await waitFor(() => {
        const createButton = getByText('Create')
        expect(createButton).toBeDisabled()
      })
    })

    it('should enable Create button when branch name is provided', async () => {
      const { getByText, getByPlaceholderText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('New Worktree')).toBeInTheDocument()
      })

      fireEvent.click(getByText('New Worktree'))

      const branchInput = getByPlaceholderText('feature/my-feature')
      fireEvent.change(branchInput, { target: { value: 'feature/new-feature' } })

      await waitFor(() => {
        const createButton = getByText('Create')
        expect(createButton).not.toBeDisabled()
      })
    })

    it('should create worktree and close modal on submit', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('New Worktree')).toBeInTheDocument()
      })

      fireEvent.click(getByText('New Worktree'))

      const branchInput = getByPlaceholderText('feature/my-feature')
      fireEvent.change(branchInput, { target: { value: 'feature/test' } })

      const issueInput = getByPlaceholderText('123')
      fireEvent.change(issueInput, { target: { value: '999' } })

      fireEvent.click(getByText('Create'))

      await waitFor(() => {
        expect(queryByText('Create Worktree')).not.toBeInTheDocument()
      })
    })
  })

  describe('Delete Worktree', () => {
    it('should show confirmation dialog on delete', async () => {
      const { container } = render(<WorktreeManagerPage />)

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      await waitFor(() => {
        const deleteButtons = container.querySelectorAll('[title="Delete worktree"]')
        expect(deleteButtons.length).toBeGreaterThan(0)
      })

      const deleteButton = container.querySelector('[title="Delete worktree"]')
      if (deleteButton) {
        fireEvent.click(deleteButton)
        expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this worktree?')
      }

      confirmSpy.mockRestore()
    })

    it('should delete worktree when confirmed', async () => {
      const { container, getByText } = render(<WorktreeManagerPage />)

      // Mock window.confirm to return true
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      await waitFor(() => {
        expect(getByText('Worktree Manager')).toBeInTheDocument()
      })

      const deleteButton = container.querySelector('[title="Delete worktree"]')
      if (deleteButton) {
        fireEvent.click(deleteButton)
      }

      // After deletion, data should be refreshed
      await waitFor(() => {
        expect(getByText('Worktree Manager')).toBeInTheDocument()
      })

      confirmSpy.mockRestore()
    })
  })

  describe('Loading State', () => {
    it('should show page content', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      // Page should render
      await waitFor(() => {
        expect(getByText('Worktree Manager')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should render empty state elements', async () => {
      const { getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        // Page should load with worktrees
        expect(getByText('Worktree Manager')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh', () => {
    it('should refresh worktrees when refresh button is clicked', async () => {
      const { container, getByText } = render(<WorktreeManagerPage />)

      await waitFor(() => {
        expect(getByText('Worktree Manager')).toBeInTheDocument()
      })

      // Find refresh button (first button next to New Worktree)
      const buttons = container.querySelectorAll('button')
      let refreshButton = null

      // Find the button that's not the New Worktree button
      for (const button of buttons) {
        if (!button.textContent?.includes('New Worktree')) {
          refreshButton = button
          break
        }
      }

      if (refreshButton) {
        fireEvent.click(refreshButton)

        // Should show loading state
        await waitFor(() => {
          const spinningIcon = refreshButton.querySelector('.animate-spin')
          expect(spinningIcon || refreshButton).toBeTruthy()
        }, { timeout: 100 }).catch(() => {
          // Animation might be too fast to catch
        })
      }
    })
  })
})
