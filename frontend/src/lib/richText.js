// Formatting for descriptions and summaries, stored as plain text.
//
//   **bold**   *italic*   ***both***   ++underline++
//   - item  /  • item        a bulleted list
//   1. item                  a numbered list
//
// It is parsed into a small tree and rendered as real elements, never as HTML,
// so nothing a user types can inject markup. The stored value is still just a
// string: it survives any export, and an old resume with no markers renders
// exactly as before. Markers are only recognised at word boundaries, so
// "C++", "5 * 3" and "snake_case" are left alone.

const MARKS = [
  { open: '***', type: 'bi' },
  { open: '**', type: 'b' },
  { open: '++', type: 'u' },
  { open: '*', type: 'i' },
]

const isSpace = (ch) => ch === undefined || /\s/.test(ch)
const isWord = (ch) => ch !== undefined && /[\p{L}\p{N}]/u.test(ch)

// An opening marker must start a word (not sit inside one, like the ++ in C++)
// and be followed by text; a closing marker must follow text.
function canOpen(text, at, len) {
  const before = text[at - 1]
  const after = text[at + len]
  return !isWord(before) && !isSpace(after) && after !== text[at]
}
function canClose(text, at) {
  return !isSpace(text[at - 1])
}

// Finds the earliest marker that has a valid opener and a matching closer.
function nextMark(text, from) {
  for (let i = from; i < text.length; i++) {
    for (const mark of MARKS) {
      if (!text.startsWith(mark.open, i)) continue
      // The longer mark wins at the same spot: "***" over "**" over "*".
      if (mark.open === '**' && text[i + 2] === '*') continue
      if (mark.open === '*' && text[i + 1] === '*') continue
      if (!canOpen(text, i, mark.open.length)) continue
      let close = text.indexOf(mark.open, i + mark.open.length + 1)
      while (close !== -1 && !canClose(text, close)) close = text.indexOf(mark.open, close + 1)
      if (close === -1) continue
      return { start: i, end: close, mark }
    }
  }
  return null
}

export function parseInline(text) {
  const nodes = []
  let at = 0
  while (at < text.length) {
    const hit = nextMark(text, at)
    if (!hit) break
    if (hit.start > at) nodes.push({ type: 'text', value: text.slice(at, hit.start) })
    const inner = text.slice(hit.start + hit.mark.open.length, hit.end)
    const children = parseInline(inner)
    // "***x***" is bold and italic at once.
    nodes.push(hit.mark.type === 'bi' ? { type: 'b', children: [{ type: 'i', children }] } : { type: hit.mark.type, children })
    at = hit.end + hit.mark.open.length
  }
  if (at < text.length) nodes.push({ type: 'text', value: text.slice(at) })
  return nodes
}

const BULLET = /^[-•–]\s+(.*)$|^\*\s+(.*)$/
const NUMBERED = /^\d+[.)]\s+(.*)$/

// Lines become blocks. With `bullets` set (job and project descriptions), a
// line with no marker is a bullet: that is how those fields have always read.
// Without it (summaries), an unmarked line is a paragraph. A blank line ends a
// list. Consecutive items of one kind share one list.
export function parseBlocks(text, { bullets = false } = {}) {
  const blocks = []
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) {
      blocks.push({ type: 'gap' })
      continue
    }
    const bullet = BULLET.exec(line)
    const numbered = NUMBERED.exec(line)
    const kind = numbered ? 'ol' : bullet || bullets ? 'ul' : 'p'
    const body = numbered ? numbered[1] : bullet ? (bullet[1] ?? bullet[2]) : line
    const last = blocks[blocks.length - 1]
    if (kind !== 'p' && last && last.type === kind) last.items.push(parseInline(body))
    else if (kind === 'p') blocks.push({ type: 'p', content: parseInline(body) })
    else blocks.push({ type: kind, items: [parseInline(body)] })
  }
  return blocks.filter((b) => b.type !== 'gap')
}

// The same text with every marker removed: used for plain contexts (a
// document title, a search) and by tests that compare what a reader would see.
export function stripMarks(text) {
  const walk = (nodes) => nodes.map((n) => (n.type === 'text' ? n.value : walk(n.children))).join('')
  return parseBlocks(text)
    .map((b) => (b.type === 'p' ? walk(b.content) : b.items.map(walk).join('\n')))
    .join('\n')
}
