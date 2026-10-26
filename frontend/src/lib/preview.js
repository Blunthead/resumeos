import { SAMPLE } from './resume.js'

// While someone is still filling a resume in, the preview shows sample content
// for whatever they haven't written yet, in grey, and their own words in full
// colour. So typing one letter of a name changes one line of a full-looking
// page, instead of turning the whole page blank.
//
// Sample content lives only in the preview: the PDF is rendered from the real
// data (see Editor), so none of it can ever be downloaded.

const CONTACT_FIELDS = ['fullName', 'jobTitle', 'email', 'phone', 'location', 'website', 'linkedin']
const SECTIONS = ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages']

const isEmpty = (data, key) => (key === 'summary' ? !data.summary.trim() : !(data[key]?.length))

// `left` is the set of sections the person has already visited and moved on
// from. An empty section they have left is empty on purpose (a fresher with no
// jobs), so it stops being filled in with a sample.
//
// Returns the data to draw and `ghost`, the ids of everything that is sample:
// "contact.email", "summary", "experience", ...
export function withSample(data, left) {
  const ghost = new Set()

  const contact = { ...data.contact }
  if (!left.has('contact')) {
    for (const field of CONTACT_FIELDS) {
      if (!String(contact[field] ?? '').trim()) {
        contact[field] = SAMPLE.contact[field]
        ghost.add(`contact.${field}`)
      }
    }
  }

  const merged = { ...data, contact }
  for (const key of SECTIONS) {
    const sample = SAMPLE[key]
    const hasSample = Array.isArray(sample) ? sample.length > 0 : Boolean(sample)
    if (hasSample && isEmpty(data, key) && !left.has(key)) {
      merged[key] = sample
      ghost.add(key)
    }
  }
  return { data: merged, ghost }
}
