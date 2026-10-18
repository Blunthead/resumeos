const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const GUEST_KEY = 'resumeos.guestId'

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

async function request(path, { method = 'GET', body, raw = false } = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'x-guest-id': getGuestId(),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
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

export const api = {
  listResumes: () => request('/api/resumes'),
  createResume: (body) => request('/api/resumes', { method: 'POST', body }),
  getResume: (id) => request(`/api/resumes/${id}`),
  updateResume: (id, body) => request(`/api/resumes/${id}`, { method: 'PUT', body }),
  deleteResume: (id) => request(`/api/resumes/${id}`, { method: 'DELETE' }),
  async renderPdf(html, filename) {
    const res = await request('/api/pdf', { method: 'POST', body: { html, filename }, raw: true })
    return res.blob()
  },
}
