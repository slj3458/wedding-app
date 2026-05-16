import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import PhotoUpload from './PhotoUpload'

describe('PhotoUpload', () => {
  it('renders the upload placeholder', () => {
    render(<PhotoUpload />)
    expect(screen.getByText('Click to select a photo')).toBeInTheDocument()
  })

  it('upload button is disabled when no file is selected', () => {
    render(<PhotoUpload />)
    expect(screen.getByText('📤 Upload Photo')).toBeDisabled()
  })

  it('rejects a non-image file', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const { container } = render(<PhotoUpload />)
    const input = container.querySelector('input[type="file"]')
    await user.upload(input, new File(['data'], 'doc.txt', { type: 'text/plain' }))
    expect(screen.getByText('Please select an image file')).toBeInTheDocument()
  })

  it('rejects an oversized file', async () => {
    const { container } = render(<PhotoUpload />)
    const input = container.querySelector('input[type="file"]')
    const file = new File(['x'], 'big.jpg', { type: 'image/jpeg' })
    vi.spyOn(file, 'size', 'get').mockReturnValue(11 * 1024 * 1024)
    await userEvent.upload(input, file)
    expect(screen.getByText('File too large. Maximum size is 10MB')).toBeInTheDocument()
  })

  it('shows success message after a successful upload', async () => {
    const { container } = render(<PhotoUpload />)
    const input = container.querySelector('input[type="file"]')
    await userEvent.upload(input, new File(['img'], 'photo.jpg', { type: 'image/jpeg' }))

    await waitFor(() =>
      expect(screen.getByText('📤 Upload Photo')).not.toBeDisabled()
    )
    await userEvent.click(screen.getByText('📤 Upload Photo'))

    await waitFor(() =>
      expect(screen.getByText('✓ Photo uploaded successfully!')).toBeInTheDocument()
    )
  })
})
