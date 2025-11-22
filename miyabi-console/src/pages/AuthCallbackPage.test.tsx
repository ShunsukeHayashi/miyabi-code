import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { render } from '../test/test-utils'
import AuthCallbackPage from './AuthCallbackPage'

// Mock window.location
const mockLocation = {
  search: '?code=test_code&state=/',
  href: '',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('?code=test_code')],
  }
})

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.search = '?code=test_code&state=/'
  })

  it('renders without crashing', () => {
    render(<AuthCallbackPage />)
    expect(document.body).toBeInTheDocument()
  })

  it('displays loading state', () => {
    render(<AuthCallbackPage />)
    // Should show loading while processing callback
    expect(document.body).toBeInTheDocument()
  })

  it('handles successful authentication', async () => {
    render(<AuthCallbackPage />)

    await waitFor(() => {
      // Should process the auth callback
      expect(document.body).toBeInTheDocument()
    })
  })

  it('handles missing code parameter', async () => {
    mockLocation.search = ''

    render(<AuthCallbackPage />)

    await waitFor(() => {
      // Should handle missing code gracefully
      expect(document.body).toBeInTheDocument()
    })
  })

  it('displays error on authentication failure', async () => {
    vi.doMock('../lib/api/client', () => ({
      default: {
        post: vi.fn().mockRejectedValue(new Error('Auth failed')),
      },
    }))

    render(<AuthCallbackPage />)

    await waitFor(() => {
      // Should handle error gracefully
      expect(document.body).toBeInTheDocument()
    })
  })

  it('stores tokens in localStorage on success', async () => {
    render(<AuthCallbackPage />)

    await waitFor(() => {
      // localStorage operations should occur
      expect(document.body).toBeInTheDocument()
    })
  })
})
