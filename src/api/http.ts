import { API_BASE_URL } from '@/constants/config'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly payload: unknown

  constructor(message: string, status: number, code: string, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

type ApiEnvelope<T> = {
  isSuccess?: boolean
  code?: string
  message?: string
  result?: T
}

function joinUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${suffix}`
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { accessToken?: string | null } = {},
): Promise<T> {
  const { accessToken, headers, ...rest } = init
  const requestHeaders = new Headers(headers)

  if (!requestHeaders.has('Content-Type') && rest.body != null) {
    requestHeaders.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(joinUrl(path), {
    credentials: 'include',
    ...rest,
    headers: requestHeaders,
  })

  const text = await response.text()
  const json = text ? (JSON.parse(text) as ApiEnvelope<T> & T) : null

  if (!response.ok) {
    const message =
      json && typeof json === 'object' && 'message' in json && typeof json.message === 'string'
        ? json.message
        : response.statusText
    const code =
      json && typeof json === 'object' && 'code' in json && typeof json.code === 'string'
        ? json.code
        : 'HTTP_ERROR'
    throw new ApiError(message, response.status, code, json)
  }

  if (json && typeof json === 'object' && 'result' in json && json.result !== undefined) {
    return json.result
  }

  return json as T
}
