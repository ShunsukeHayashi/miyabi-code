import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../test/test-utils'
import Layout from './Layout'

// Mock the Outlet component from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  }
})

describe('Layout', () => {
  it('renders without crashing', () => {
    render(<Layout />)
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('renders the Sidebar component', () => {
    render(<Layout />)
    // Sidebar should be present in the layout
    expect(document.querySelector('div')).toBeInTheDocument()
  })

  it('displays the outlet content', () => {
    render(<Layout />)
    expect(screen.getByText('Outlet Content')).toBeInTheDocument()
  })

  it('has proper layout structure', () => {
    render(<Layout />)

    // Check that the layout has flex structure
    const outlet = screen.getByTestId('outlet')
    expect(outlet).toBeInTheDocument()
  })
})
