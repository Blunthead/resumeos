import { useEffect, useState } from 'react'

export const NAMES = ['Alex Morgan', 'Priya Sharma', 'Sam Okafor', 'Mei Tanaka']

// Types a name, holds it, deletes it, moves to the next. It starts with the
// first name already written so the first frame is never empty. When disabled
// (for people who've asked for less motion) it simply holds that name.
export function useTyped(names, enabled) {
  const [state, setState] = useState({ i: 0, n: names[0].length, deleting: false })

  useEffect(() => {
    if (!enabled) return undefined
    const full = names[state.i]
    let delay = state.deleting ? 24 : 85
    let next
    if (!state.deleting && state.n === full.length) {
      delay = 1800
      next = { ...state, deleting: true }
    } else if (state.deleting && state.n === 0) {
      delay = 220
      next = { i: (state.i + 1) % names.length, n: 0, deleting: false }
    } else {
      next = { ...state, n: state.n + (state.deleting ? -1 : 1) }
    }
    const id = setTimeout(() => setState(next), delay)
    return () => clearTimeout(id)
  }, [state, names, enabled])

  return enabled ? names[state.i].slice(0, state.n) : names[0]
}
