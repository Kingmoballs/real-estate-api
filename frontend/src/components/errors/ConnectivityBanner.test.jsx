import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ConnectivityBanner from './ConnectivityBanner.jsx'

describe('ConnectivityBanner', () => {
  it('appears while the API is unavailable and clears after recovery', () => {
    render(<ConnectivityBanner />)

    act(() => {
      window.dispatchEvent(new Event('haven:api-unavailable'))
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Haven cannot reach the API right now',
    )

    act(() => {
      window.dispatchEvent(new Event('haven:api-available'))
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
