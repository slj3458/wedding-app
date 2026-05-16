import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Guestbook from './Guestbook'

vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: () => ({ messages: [] }),
}))

describe('Guestbook', () => {
  it('shows entries loaded from the API', async () => {
    render(<Guestbook />)
    await waitFor(() => expect(screen.getByText('Congrats!')).toBeInTheDocument())
  })

  it('shows the correct entry count heading', async () => {
    render(<Guestbook />)
    await waitFor(() => expect(screen.getByText('Messages (1)')).toBeInTheDocument())
  })

  it('submits a new entry and shows a success notification', async () => {
    render(<Guestbook />)
    await waitFor(() => screen.getByLabelText('Your Name'))

    await userEvent.type(screen.getByLabelText('Your Name'), 'Bob')
    await userEvent.type(screen.getByLabelText('Your Message'), 'Best wishes!')
    await userEvent.click(screen.getByText('💌 Sign Guestbook'))

    await waitFor(() =>
      expect(screen.getByText('✓ Your message has been added!')).toBeInTheDocument()
    )
  })

  it('shows a validation error when name is empty', async () => {
    render(<Guestbook />)
    await waitFor(() => screen.getByLabelText('Your Name'))

    await userEvent.click(screen.getByText('💌 Sign Guestbook'))
    expect(screen.getByText('Please enter your name')).toBeInTheDocument()
  })

  it('shows a validation error when message is empty', async () => {
    render(<Guestbook />)
    await waitFor(() => screen.getByLabelText('Your Name'))

    await userEvent.type(screen.getByLabelText('Your Name'), 'Dave')
    await userEvent.click(screen.getByText('💌 Sign Guestbook'))
    expect(screen.getByText('Please enter a message')).toBeInTheDocument()
  })
})
