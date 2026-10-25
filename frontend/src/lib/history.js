// Undo and redo for the editor.
//
// Typing is recorded as one step per burst, not one per keystroke: edits made
// within `gapMs` of the last one extend the same step, so Undo takes back a
// phrase, not a letter. Anything structural (reordering, adding a section,
// switching template) is always its own step.
//
// The history holds snapshots of the resume's state. Snapshots are replaced
// rather than mutated by the editor, so they share unchanged parts and cost
// little memory.
export function createHistory({ limit = 100, gapMs = 800 } = {}) {
  let past = []
  let future = []
  let lastAt = 0
  let lastKey = null

  return {
    // Call with the state BEFORE a change is applied. `key` names what is being
    // edited (a field), so a pause or a move to another field starts a new step.
    record(snapshot, { key = null, now = Date.now() } = {}) {
      const continues = key !== null && key === lastKey && now - lastAt <= gapMs
      if (!continues) {
        past.push(snapshot)
        if (past.length > limit) past.shift()
      }
      future = []
      lastAt = now
      lastKey = key
    },
    undo(current) {
      if (!past.length) return null
      future.push(current)
      lastKey = null
      return past.pop()
    },
    redo(current) {
      if (!future.length) return null
      past.push(current)
      lastKey = null
      return future.pop()
    },
    get canUndo() {
      return past.length > 0
    },
    get canRedo() {
      return future.length > 0
    },
  }
}
