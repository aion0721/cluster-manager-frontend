import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, setAccessTokenProvider } from './client'

describe('apiRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setAccessTokenProvider(() => undefined)
  })

  it('adds X-User-Id and JSON content headers in simple auth mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/api/example', {
      method: 'POST',
      body: { value: 1 },
      userId: 'admin',
    })

    const [, init] = fetchMock.mock.calls[0]
    const headers = init.headers as Headers
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ value: 1 }))
    expect(headers.get('X-User-Id')).toBe('admin')
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('throws ApiError with backend message details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'bad base image' }), {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(apiRequest('/api/example')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'API request failed: 400 Bad Request: bad base image',
      details: { message: 'bad base image' },
    })
  })
})
