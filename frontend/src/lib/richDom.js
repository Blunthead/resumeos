// Converts between the stored marker text (see richText.js) and the editable
// document the formatting toolbar works on. The editor shows real bold, italic,
// underline and lists, so no one ever sees a `**` unless they type one; this is
// the one place that turns what is on screen back into the stored string.
//
// `markersFromDom` reads only nodeType, nodeName, nodeValue, childNodes and
// style, so it runs against a real DOM and against the small fakes in the tests.

import { parseBlocks } from './richText.js'

const TEXT = 3
const ELEMENT = 1

const BLOCK = new Set(['DIV', 'P', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'])

// Which marks an element carries: its tag, or the inline style a browser or a
// paste sometimes uses in its place.
function marksOf(node) {
  const name = node.nodeName
  const style = node.style ?? {}
  const marks = []
  const weight = String(style.fontWeight ?? '')
  if (name === 'B' || name === 'STRONG' || weight === 'bold' || Number(weight) >= 600) marks.push('**')
  if (name === 'I' || name === 'EM' || style.fontStyle === 'italic') marks.push('*')
  const deco = `${style.textDecorationLine ?? ''} ${style.textDecoration ?? ''}`
  if (name === 'U' || deco.includes('underline')) marks.push('++')
  return marks
}

// A mark has to hug its text ("**a **" would not parse), so spaces at either
// end move outside the markers and an all-space run gets no markers at all.
function wrap(text, marks) {
  if (!marks.length) return text
  const lead = /^\s*/.exec(text)[0]
  const trail = /\s*$/.exec(text.slice(lead.length))[0]
  const core = text.slice(lead.length, text.length - trail.length)
  if (!core) return text
  const open = marks.join('')
  const close = [...marks].reverse().join('')
  return lead + open + core + close + trail
}

// Characters that would read as markers are escaped, so what someone typed is
// what the resume shows: "rated *very* high" stays literal, "C++" stays "C++".
const escapeText = (text) =>
  text
    .replace(/[*\\]/g, (c) => '\\' + c)
    .replace(/\+{2,}/g, (run) => '\\+'.repeat(run.length))

function inline(node) {
  if (node.nodeType === TEXT) {
    // A browser may keep a typed Shift+Enter as a newline inside the text.
    return escapeText(String(node.nodeValue ?? '').replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n'))
  }
  if (node.nodeType !== ELEMENT) return ''
  if (node.nodeName === 'BR') return '\n'
  let out = ''
  for (const child of node.childNodes) out += inline(child)
  return wrap(out, marksOf(node))
}

// Two bold runs the browser left side by side ("**a****b**") are one run.
const tidy = (s) => s.replace(/\*\*\*\*/g, '').replace(/\+\+\+\+/g, '')

const isBlock = (node) => node.nodeType === ELEMENT && BLOCK.has(node.nodeName)
const isList = (node) => node.nodeName === 'UL' || node.nodeName === 'OL'
const hasBlockChild = (node) => Array.from(node.childNodes).some(isBlock)

// A browser puts a lone <br> in an empty line, or one at the end of a line, so
// it keeps its height; that one is not a line break of its own.
function split(text) {
  const parts = text.split('\n')
  if (parts.length > 1 && parts[parts.length - 1] === '') parts.pop()
  return parts
}

// Blocks can nest (a list inside the first line's <div>, which is what a browser
// builds when a list ends), so every container is walked, not just the root.
function collect(container, out) {
  let run = ''
  const flush = () => {
    if (run === '') return
    out.push(...split(run))
    run = ''
  }
  for (const child of container.childNodes) {
    if (!isBlock(child)) {
      run += inline(child)
      continue
    }
    flush()
    if (isList(child)) {
      let n = 0
      for (const li of child.childNodes) {
        if (li.nodeType !== ELEMENT) continue
        n++
        const marker = child.nodeName === 'OL' ? n + '. ' : '- '
        const parts = split(inline(li))
        out.push(marker + parts[0], ...parts.slice(1))
      }
    } else if (hasBlockChild(child)) {
      collect(child, out)
    } else {
      out.push(...split(inline(child)))
    }
  }
  flush()
}

export function markersFromDom(root) {
  const out = []
  collect(root, out)
  return tidy(out.join('\n'))
}

// The reverse: stored text to the elements the editor shows. In a field where
// every line is a bullet (jobs, projects) an unmarked line stays a plain line
// here, as it always has in the form; the resume itself bullets it.
export function fillEditor(root, text) {
  const doc = root.ownerDocument
  const add = (parent, nodes) => {
    for (const n of nodes) {
      if (n.type === 'text') {
        parent.append(doc.createTextNode(n.value))
      } else {
        const el = doc.createElement(n.type === 'b' ? 'b' : n.type === 'i' ? 'i' : 'u')
        add(el, n.children)
        parent.append(el)
      }
    }
  }
  const fragment = doc.createDocumentFragment()
  for (const block of parseBlocks(text)) {
    if (block.type === 'p') {
      const div = doc.createElement('div')
      add(div, block.content)
      fragment.append(div)
    } else {
      const list = doc.createElement(block.type)
      for (const item of block.items) {
        const li = doc.createElement('li')
        add(li, item)
        list.append(li)
      }
      fragment.append(list)
    }
  }
  // An empty editor still holds one empty line. Typed straight into the root,
  // text has no block around it, and a browser then drops the caret at the
  // start of the line when a list button is pressed.
  if (!fragment.childNodes.length) {
    const line = doc.createElement('div')
    line.append(doc.createElement('br'))
    fragment.append(line)
  }
  root.replaceChildren(fragment)
}

// Some browsers throw the caret to the start of the text after a list button is
// pressed. The selection is remembered as character offsets, which a change of
// markup does not alter, and put back afterwards.
function offsetOf(root, node, offset) {
  const range = root.ownerDocument.createRange()
  range.selectNodeContents(root)
  range.setEnd(node, offset)
  return range.toString().length
}

export function saveSelection(root) {
  const sel = root.ownerDocument.getSelection()
  if (!sel || !sel.rangeCount || !root.contains(sel.anchorNode) || !root.contains(sel.focusNode)) return null
  return { anchor: offsetOf(root, sel.anchorNode, sel.anchorOffset), focus: offsetOf(root, sel.focusNode, sel.focusOffset) }
}

function pointAt(root, target) {
  const walker = root.ownerDocument.createTreeWalker(root, 4) // text nodes
  let seen = 0
  let last = null
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    last = node
    if (seen + node.nodeValue.length >= target) return [node, target - seen]
    seen += node.nodeValue.length
  }
  return last ? [last, last.nodeValue.length] : [root, 0]
}

export function restoreSelection(root, saved) {
  if (!saved) return
  const sel = root.ownerDocument.getSelection()
  const [an, ao] = pointAt(root, saved.anchor)
  const [fn, fo] = pointAt(root, saved.focus)
  sel.setBaseAndExtent(an, ao, fn, fo)
}
