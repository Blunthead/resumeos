// A resume that was just created is handed straight to the editor, so opening
// it doesn't cost a second request for data we already hold.
//
// This lives in memory on purpose. Router state would survive a page refresh
// and could then show a stale copy; memory is gone on refresh, so a reload
// always reads the real thing from the server. Entries also expire, so a
// forgotten one can never be served later.
const TTL_MS = 15_000
const held = new Map()

export const handoff = {
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
