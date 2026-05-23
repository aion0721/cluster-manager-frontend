type ApiRequestOptions = {
  method?: string
  body?: unknown
  headers?: HeadersInit
  userId?: string
}

export const USER_ID_STORAGE_KEY = 'cluster-manager.userId'

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  const userId = options.userId

  if (userId && !headers.has('X-User-Id')) {
    headers.set('X-User-Id', userId)
  }

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const contentType = response.headers.get('Content-Type') ?? ''
  const hasJson = contentType.includes('application/json')
  const payload = hasJson ? await response.json() : await response.text()

  if (!response.ok) {
    const bodyText =
      typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? `API request failed: ${response.status} ${response.statusText}: ${String(payload.message)}`
        : bodyText
          ? `API request failed: ${response.status} ${response.statusText}: ${bodyText}`
          : `API request failed: ${response.status} ${response.statusText}`

    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}
