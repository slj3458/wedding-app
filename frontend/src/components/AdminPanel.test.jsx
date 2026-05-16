import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AdminPanel from './AdminPanel'

describe('AdminPanel', () => {
  it('renders the lock icon button', () => {
    render(<AdminPanel onAdminChange={() => {}} />)
    expect(screen.getByTitle('Admin Login')).toBeInTheDocument()
  })

  it('shows the password form when the lock is clicked', async () => {
    render(<AdminPanel onAdminChange={() => {}} />)
    await userEvent.click(screen.getByTitle('Admin Login'))
    expect(screen.getByPlaceholderText('Enter admin password')).toBeInTheDocument()
  })

  it('shows admin active state on correct password', async () => {
    const onAdminChange = vi.fn()
    render(<AdminPanel onAdminChange={onAdminChange} />)

    await userEvent.click(screen.getByTitle('Admin Login'))
    await userEvent.type(screen.getByPlaceholderText('Enter admin password'), 'correct')
    await userEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() =>
      expect(screen.getByText('⚡ Admin Mode Active')).toBeInTheDocument()
    )
    expect(onAdminChange).toHaveBeenCalledWith(true, 'test-token')
  })

  it('shows error message on wrong password', async () => {
    render(<AdminPanel onAdminChange={() => {}} />)

    await userEvent.click(screen.getByTitle('Admin Login'))
    await userEvent.type(screen.getByPlaceholderText('Enter admin password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() =>
      expect(screen.getByText('Invalid password. Please try again.')).toBeInTheDocument()
    )
  })

  it('calls onAdminChange(false, null) on logout', async () => {
    const onAdminChange = vi.fn()
    render(<AdminPanel onAdminChange={onAdminChange} />)

    await userEvent.click(screen.getByTitle('Admin Login'))
    await userEvent.type(screen.getByPlaceholderText('Enter admin password'), 'correct')
    await userEvent.click(screen.getByRole('button', { name: 'Login' }))
    await waitFor(() => screen.getByRole('button', { name: 'Logout' }))
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() =>
      expect(onAdminChange).toHaveBeenLastCalledWith(false, null)
    )
  })
})
