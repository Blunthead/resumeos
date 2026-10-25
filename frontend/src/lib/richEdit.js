// Edits to a text field's value for the formatting toolbar. Each function takes
// the current value and selection and returns the new value and selection; the
// component only has to apply them. Keeping them pure is what makes the fiddly
// cases (toggling off, nested marks, partial lines) testable.

const MARK = { bold: '**', italic: '*', underline: '++' }

// How many copies of `ch` run outward from `index` (dir -1 = leftwards from
// just before it, +1 = rightwards starting at it).
function run(value, index, dir, ch) {
  let n = 0
  for (let i = dir < 0 ? index - 1 : index; i >= 0 && i < value.length && value[i] === ch; i += dir) n++
  return n
}

// Wraps the selection in a mark, or removes it if the selection is already
// wrapped. With nothing selected, drops an empty pair and puts the caret
// between, ready to type.
export function toggleMark(value, start, end, kind) {
  const mark = MARK[kind]
  const ch = mark[0]
  const len = mark.length
  const before = run(value, start, -1, ch)
  const after = run(value, end, 1, ch)
  // For italic, a run of one or three stars is italic; two is bold.
  const wrapped = kind === 'italic' ? Math.min(before, after) % 2 === 1 : Math.min(before, after) >= len

  // Nothing selected, caret just inside a closing marker: a second press means
  // "I'm done with this", so step past the marker instead of opening a new one.
  if (start === end && start > 0 && !/\s/.test(value[start - 1])) {
    const closing = kind === 'italic' ? after % 2 === 1 : after >= len
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const opened = (value.slice(lineStart, start).split(mark).length - 1) % 2 === 1
    if (closing && (opened || (kind !== 'italic' && before === 0 && after >= len))) {
      return { value, start: start + len, end: start + len }
    }
  }

  if (wrapped && start !== end) {
    return {
      value: value.slice(0, start - len) + value.slice(start, end) + value.slice(end + len),
      start: start - len,
      end: end - len,
    }
  }
  const inner = value.slice(start, end)
  return {
    value: value.slice(0, start) + mark + inner + mark + value.slice(end),
    start: start + len,
    end: end + len,
  }
}

const BULLET = /^\s*(?:[-•–]|\*)\s+/
const NUMBER = /^\s*\d+[.)]\s+/

// Bulleted or numbered list on every line the selection touches. If they all
// already are that kind of list, the markers come off; otherwise they go on
// (replacing the other kind).
export function toggleList(value, start, end, kind) {
  const from = value.lastIndexOf('\n', start - 1) + 1
  const nl = value.indexOf('\n', end)
  const to = nl === -1 ? value.length : nl
  const lines = value.slice(from, to).split('\n')

  const has = (line) => (kind === 'bullet' ? BULLET : NUMBER).test(line)
  const work = lines.filter((l) => l.trim())
  const allOn = work.length > 0 && work.every(has)
  const strip = (line) => line.replace(BULLET, '').replace(NUMBER, '')

  let n = 0
  const next = lines.map((line) => {
    if (!line.trim()) return line
    if (allOn) return strip(line)
    n++
    return (kind === 'bullet' ? '- ' : `${n}. `) + strip(line)
  })
  const text = next.join('\n')
  return { value: value.slice(0, from) + text + value.slice(to), start: from, end: from + text.length }
}

// Pressing Enter inside a list item starts the next item; pressing it on an
// empty item ends the list. Returns null when the line isn't a list item, so
// Enter behaves normally everywhere else.
export function continueList(value, caret) {
  const lineStart = value.lastIndexOf('\n', caret - 1) + 1
  const line = value.slice(lineStart, caret)
  const bullet = /^(\s*)(?:[-•–]|\*)\s+(.*)$/.exec(line)
  const number = /^(\s*)(\d+)([.)])\s+(.*)$/.exec(line)
  const match = bullet || number
  if (!match) return null

  const body = bullet ? bullet[2] : number[4]
  if (!body.trim()) {
    // An empty item: drop its marker and leave a plain line.
    return { value: value.slice(0, lineStart) + value.slice(caret), start: lineStart, end: lineStart }
  }
  const marker = bullet ? '- ' : `${Number(number[2]) + 1}${number[3]} `
  const insert = `\n${match[1]}${marker}`
  const at = caret + insert.length
  return { value: value.slice(0, caret) + insert + value.slice(caret), start: at, end: at }
}
