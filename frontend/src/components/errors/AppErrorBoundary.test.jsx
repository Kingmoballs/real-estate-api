import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppErrorBoundary from './AppErrorBoundary.jsx'

function BrokenPage({ message = 'Render failed' }) {
  throw new Error(message)
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows recovery actions when a page fails to render', () => {
    render(
      <AppErrorBoundary>
        <BrokenPage />
      </AppErrorBoundary>,
    )

    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Refresh page' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Return home' }),
    ).toHaveAttribute('href', '/')
  })

  it('asks for a refresh when a lazy route chunk is stale', () => {
    render(
      <AppErrorBoundary>
        <BrokenPage message="Failed to fetch dynamically imported module" />
      </AppErrorBoundary>,
    )

    expect(
      screen.getByRole('heading', {
        name: 'A newer version is available',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument()
  })
})
