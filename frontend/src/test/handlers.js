import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/guestbook/entries', () =>
    HttpResponse.json({
      entries: [
        { id: 1, name: 'Alice', message: 'Congrats!', created_at: '2024-01-01T12:00:00Z' },
      ],
      total: 1,
    })
  ),

  http.post('/api/guestbook/entry', () =>
    HttpResponse.json({
      id: 2,
      name: 'Bob',
      message: 'Best wishes!',
      created_at: '2024-01-01T12:00:00Z',
    })
  ),

  http.post('/api/admin/login', async ({ request }) => {
    const body = await request.json()
    if (body.password === 'correct') {
      return HttpResponse.json({ success: true, token: 'test-token' })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  http.post('/api/admin/logout', () =>
    HttpResponse.json({ success: true, message: 'Logged out' })
  ),

  http.post('/api/gallery/upload', () =>
    HttpResponse.json({ id: 1, filename: 'abc123.jpg', message: 'Photo uploaded successfully' })
  ),
]
