const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const GUEST_KEY = 'resumeos.guestId'

// The free host puts the API to sleep when idle, and waking it takes up to a
// minute. A shorter timeout would report "can't reach the server" for a server
// that is simply still starting.
const TIMEOUT_MS = 60_000

// Until real accounts exist, the browser identifies itself with a random id.
// It is a stand-in, not authentication — see server/src/middleware/guest.ts.
export function getGuestId() {
  try {
    let id = localStorage.getItem(GUEST_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(GUEST_KEY, id)
    }
    return id
  } catch {
    // Storage blocked: fall back to an id that lasts for this tab only.
    return (getGuestId.memory ??= crypto.randomUUID())
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Reads can safely be tried twice: a request that lands just as the host is
// waking up often fails once and works a moment later.
const RETRYABLE = new Set([0, 502, 503, 504])

async function attempt(path, { method, body, raw, keepalive }) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'x-guest-id': getGuestId(),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      keepalive,
    })
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0)
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new ApiError(detail?.error || 'Something went wrong. Please try again.', res.status)
  }
  if (raw) return res
  return res.status === 204 ? null : res.json()
}

async function request(path, options = {}) {
  const opts = { method: 'GET', ...options }
  try {
    return await attempt(path, opts)
  } catch (error) {
    if (opts.method !== 'GET' || !RETRYABLE.has(error.status)) throw error
    await wait(1500)
    return attempt(path, opts)
  }
}

let warmed = false

export const api = {
  // Wakes a sleeping server while the visitor is still reading the landing
  // page, so it is already up by the time they press "Create". A plain GET
  // with no custom headers, so the browser sends no preflight for it.
  warm() {
    if (warmed) return
    warmed = true
    fetch(`${API_URL}/`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {})
  },
  // Also asks the browser to approve this origin for /api/resumes up front;
  // that approval is cached, so the "create" that follows skips its own
  // preflight round trip.
  prime: () => request('/api/resumes').catch(() => {}),
  listResumes: () => request('/api/resumes'),
  createResume: (body) => request('/api/resumes', { method: 'POST', body }),
  getResume: (id) => request(`/api/resumes/${id}`),
  updateResume: (id, body, { keepalive = false } = {}) =>
    request(`/api/resumes/${id}`, { method: 'PUT', body, keepalive }),
  deleteResume: (id) => request(`/api/resumes/${id}`, { method: 'DELETE' }),
  async renderPdf(html, filename) {
    const res = await request('/api/pdf', { method: 'POST', body: { html, filename }, raw: true })
    return res.blob()
  },
}
