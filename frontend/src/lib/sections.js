import { newId } from './resume.js'

// The built-in sections, in their default order. A custom section is keyed
// `custom:<id>`; both kinds live in one ordered list.
export const NATIVE_SECTIONS = ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages']

export const SECTION_LABEL = {
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  languages: 'Languages',
}

// What the sidebar templates keep in their side panel; the rest, and every
// custom section, go in the main column.
const SIDE = new Set(['skills', 'education', 'certifications', 'languages'])
export const inSidebar = (key) => SIDE.has(key)

export const customKey = (id) => `custom:${id}`
export const isCustomKey = (key) => key.startsWith('custom:')
export const customIdOf = (key) => key.slice('custom:'.length)

// Ideas shown when adding a section; any title works.
export const SECTION_SUGGESTIONS = [
  'Volunteer Work', 'Achievements', 'Awards', 'Publications', 'Research', 'Patents',
  'Hackathons', 'Leadership', 'Open Source', 'Freelance', 'Hobbies', 'Community Work',
]

// The order to display. Starts from what the user arranged, drops keys that no
// longer exist (a deleted custom section) and appends any that are missing (a
// section added since), so a stale `order` can never hide or duplicate one.
export function resolveOrder(data) {
  const custom = data.custom.map((c) => customKey(c.id))
  const valid = new Set([...NATIVE_SECTIONS, ...custom])
  const seen = new Set()
  const out = []
  for (const key of [...data.order, ...NATIVE_SECTIONS, ...custom]) {
    if (valid.has(key) && !seen.has(key)) {
      seen.add(key)
      out.push(key)
    }
  }
  return out
}

export function sectionTitle(data, key) {
  if (isCustomKey(key)) return data.custom.find((c) => c.id === customIdOf(key))?.title || 'Untitled section'
  return SECTION_LABEL[key]
}

// Moves one item within a list. Out-of-range moves are ignored.
export function move(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// A copy of a list entry or custom section with fresh ids, so the duplicate
// and the original never share a React key or a saved id.
export function duplicate(item) {
  const copy = { ...item, id: newId() }
  if (Array.isArray(item.entries)) copy.entries = item.entries.map((e) => ({ ...e, id: newId() }))
  if (typeof item.title === 'string' && Array.isArray(item.entries)) copy.title = `${item.title} (copy)`.slice(0, 60)
  return copy
}
