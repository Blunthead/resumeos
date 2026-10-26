// A resume that was just created is handed straight to the editor, so opening
// it doesn't cost a second request for data we already hold.
//
// This lives in memory on purpose. Router state would survive a page refresh
// and could then show a stale copy; memory is gone on refresh, so a reload
// always reads the real thing from the server. Entries also expire, so a
// forgotten one can never be served later.
const TTL_MS = 15_000
const held = new Map()

// A new resume's id is chosen here, in the browser, so the editor can open the
// moment a template is clicked. The server is told in the background; the
// first save waits for it (see `ready`). Same shape as a Mongo ObjectId.
export function newResumeId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Resumes the server may not have heard about yet. Unlike `held` these do not
// expire: a slow server must not make the editor forget a resume it owes.
const creating = new Map()

export const handoff = {
  // Starts creating the resume on the server. `create` can safely run twice,
  // because the server treats the same id as the same resume.
  start(id, create) {
    const entry = { create, promise: create() }
    entry.promise.catch(() => {}) // surfaced by `ready`, not as an unhandled rejection
    creating.set(id, entry)
  },
  // Resolves once the server has the resume. If the first attempt failed it
  // tries once more, so a server that was only waking up is not fatal.
  async ready(id) {
    const entry = creating.get(id)
    if (!entry) return
    try {
      await entry.promise
    } catch {
      entry.promise = entry.create()
      entry.promise.catch(() => {})
      await entry.promise
    }
    creating.delete(id)
  },
  put(resume) {
    held.set(resume._id, { resume, at: Date.now() })
  },
  peek(id) {
    const entry = held.get(id)
    if (!entry) return null
    if (Date.now() - entry.at > TTL_MS) {
      held.delete(id)
      return null
    }
    return entry.resume
  },
  drop(id) {
    held.delete(id)
  },
}
