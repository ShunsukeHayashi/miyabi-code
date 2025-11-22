import { render, fireEvent, waitFor } from '@/test/test-utils'
import OrganizationsPage from './OrganizationsPage'
import { vi, describe, it, expect, beforeEach } from 'vitest'

describe('OrganizationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the page title', async () => {
      const { getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('Organizations')).toBeInTheDocument()
      })
    })

    it('should render organization list after loading', async () => {
      const { getAllByText, getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        // Miyabi Labs appears multiple times (in list and switcher)
        expect(getAllByText('Miyabi Labs').length).toBeGreaterThan(0)
        expect(getByText('Development Team')).toBeInTheDocument()
        expect(getByText('Customer Success')).toBeInTheDocument()
      })
    })

    it('should render New Organization button', async () => {
      const { getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('New Organization')).toBeInTheDocument()
      })
    })

    it('should render organization switcher', async () => {
      const { getAllByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        // Organization switcher shows current organization name
        expect(getAllByText('Miyabi Labs').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Organization List', () => {
    it('should display organization role badges', async () => {
      const { getAllByText, getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getAllByText('owner').length).toBeGreaterThan(0)
        expect(getByText('admin')).toBeInTheDocument()
        expect(getByText('member')).toBeInTheDocument()
      })
    })

    it('should display organization plan tiers', async () => {
      const { getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('enterprise')).toBeInTheDocument()
        expect(getByText('pro')).toBeInTheDocument()
        expect(getByText('free')).toBeInTheDocument()
      })
    })

    it('should display member counts', async () => {
      const { getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('12 members')).toBeInTheDocument()
        expect(getByText('5 members')).toBeInTheDocument()
        expect(getByText('3 members')).toBeInTheDocument()
      })
    })
  })

  describe('Organization Details', () => {
    it('should display organization details when selected', async () => {
      const { getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        // First organization should be auto-selected
        expect(getByText('ENTERPRISE')).toBeInTheDocument()
      })
    })

    it('should show Members tab by default', async () => {
      const { getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('Members')).toBeInTheDocument()
        expect(getByText('Invite Member')).toBeInTheDocument()
      })
    })

    it('should display member list', async () => {
      const { getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('Shunsuke Hayashi')).toBeInTheDocument()
        expect(getByText('Yuki Tanaka')).toBeInTheDocument()
        expect(getByText('Ken Yamamoto')).toBeInTheDocument()
        expect(getByText('Sakura Ito')).toBeInTheDocument()
      })
    })

    it('should display member emails', async () => {
      const { getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('owner@miyabi.dev')).toBeInTheDocument()
        expect(getByText('admin@miyabi.dev')).toBeInTheDocument()
      })
    })
  })

  describe('Tabs', () => {
    it('should switch to Pending Invitations tab', async () => {
      const { getByText, findByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('Pending Invitations')).toBeInTheDocument()
      })

      fireEvent.click(getByText('Pending Invitations'))

      expect(await findByText('newuser@example.com')).toBeInTheDocument()
    })

    it('should switch to Activity tab', async () => {
      const { getByText, findByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('Activity')).toBeInTheDocument()
      })

      fireEvent.click(getByText('Activity'))

      expect(await findByText('Activity log coming soon...')).toBeInTheDocument()
    })
  })

  describe('Modals', () => {
    it('should open create organization modal when clicking New Organization', async () => {
      const { getByText, findByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('New Organization')).toBeInTheDocument()
      })

      fireEvent.click(getByText('New Organization'))

      expect(await findByText('Create New Organization')).toBeInTheDocument()
      expect(await findByText('Organization Name')).toBeInTheDocument()
      expect(await findByText('Slug (URL-friendly name)')).toBeInTheDocument()
    })

    it('should open invite member modal when clicking Invite Member', async () => {
      const { getByText, findByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('Invite Member')).toBeInTheDocument()
      })

      fireEvent.click(getByText('Invite Member'))

      expect(await findByText('Email Address')).toBeInTheDocument()
      expect(await findByText('Send Invitation')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should transition from loading to loaded state', async () => {
      const { getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText('Your Organizations')).toBeInTheDocument()
      })
    })
  })

  describe('Organization Slug', () => {
    it('should display organization slugs', async () => {
      const { getAllByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        // Slugs appear multiple times (in list cards and detail view)
        expect(getAllByText('/miyabi-labs').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Creation Date', () => {
    it('should display organization creation date', async () => {
      const { getByText } = render(<OrganizationsPage />)

      await waitFor(() => {
        expect(getByText(/Created on/)).toBeInTheDocument()
      })
    })
  })
})
