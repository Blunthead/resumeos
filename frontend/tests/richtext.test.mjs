import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBlocks, parseInline, stripMarks } from '../src/lib/richText.js'
import { markersFromDom } from '../src/lib/richDom.js'
import { createHistory } from '../src/lib/history.js'
import { NATIVE_SECTIONS, customKey, duplicate, move, resolveOrder } from '../src/lib/sections.js'
import { blankCustomSection, normalizeData } from '../src/lib/resume.js'

const flat = (nodes) => JSON.stringify(nodes)

describe('inline formatting', () => {
  test('bold, italic and underline', () => {
    assert.deepEqual(parseInline('a **b** c'), [
      { type: 'text', value: 'a ' },
      { type: 'b', children: [{ type: 'text', value: 'b' }] },
      { type: 'text', value: ' c' },
    ])
    assert.equal(parseInline('*i*')[0].type, 'i')
    assert.equal(parseInline('++u++')[0].type, 'u')
  })

  test('marks nest', () => {
    const [node] = parseInline('**bold *and italic* text**')
    assert.equal(node.type, 'b')
    assert.ok(node.children.some((c) => c.type === 'i'))
  })

  test('text that merely contains the characters is left alone', () => {
    for (const text of ['C++ and C++', '5 * 3 = 15', 'snake_case_name', '2 ** 8', 'a*b', 'use ++ sparingly', '**', '* alone']) {
      assert.equal(stripMarks(text.startsWith('* ') ? 'x' : text), text.startsWith('* ') ? 'x' : text, text)
    }
    assert.equal(parseInline('C++ developer, C++ expert').every((n) => n.type === 'text'), true)
  })

  test('an unclosed mark is literal text', () => {
    assert.equal(flat(parseInline('**oops')), flat([{ type: 'text', value: '**oops' }]))
  })

  test('no markup is ever produced from user text', () => {
    const nodes = parseInline('<script>alert(1)</script> **<b>x</b>**')
    assert.ok(nodes.every((n) => ['text', 'b', 'i', 'u'].includes(n.type)))
    assert.match(stripMarks('<img src=x onerror=alert(1)>'), /<img/, 'tags stay as inert text')
  })
})

describe('blocks', () => {
  test('with bullets on, every unmarked line is a bullet, as job descriptions always were', () => {
    const [list] = parseBlocks('one\ntwo\n- three', { bullets: true })
    assert.equal(list.type, 'ul')
    assert.equal(list.items.length, 3)
  })

  test('with bullets off, unmarked lines are paragraphs and markers make lists', () => {
    const blocks = parseBlocks('intro\n- a\n- b\nafter', { bullets: false })
    assert.deepEqual(blocks.map((b) => b.type), ['p', 'ul', 'p'])
  })

  test('numbered lists, and a blank line splits two lists', () => {
    const blocks = parseBlocks('1. a\n2. b\n\n1. c', { bullets: false })
    assert.deepEqual(blocks.map((b) => [b.type, b.items.length]), [['ol', 2], ['ol', 1]])
  })

  test('a leading asterisk is a bullet only when followed by a space', () => {
    assert.equal(parseBlocks('* item')[0].type, 'ul')
    assert.equal(parseBlocks('*italic* start')[0].type, 'p')
  })

  test('empty input renders nothing', () => {
    assert.deepEqual(parseBlocks(''), [])
    assert.deepEqual(parseBlocks(undefined), [])
    assert.deepEqual(parseBlocks('\n\n  \n'), [])
  })
})

describe('undo history', () => {
  test('typing in one field within a burst is one step', () => {
    const h = createHistory({ gapMs: 800 })
    h.record('v0', { key: 'name', now: 0 })
    h.record('v1', { key: 'name', now: 100 })
    h.record('v2', { key: 'name', now: 200 })
    assert.equal(h.undo('v3'), 'v0')
    assert.equal(h.canUndo, false)
  })

  test('a pause or a different field starts a new step', () => {
    const h = createHistory({ gapMs: 800 })
    h.record('a', { key: 'name', now: 0 })
    h.record('b', { key: 'name', now: 2000 })
    h.record('c', { key: 'email', now: 2100 })
    assert.equal(h.undo('d'), 'c')
    assert.equal(h.undo('c'), 'b')
    assert.equal(h.undo('b'), 'a')
  })

  test('structural changes are always their own step', () => {
    const h = createHistory()
    h.record('a', { now: 0 })
    h.record('b', { now: 1 })
    assert.equal(h.undo('c'), 'b')
  })

  test('redo restores, and a new edit clears the redo stack', () => {
    const h = createHistory()
    h.record('a', { now: 0 })
    assert.equal(h.undo('b'), 'a')
    assert.equal(h.canRedo, true)
    assert.equal(h.redo('a'), 'b')
    h.undo('b')
    h.record('x', { now: 5 })
    assert.equal(h.canRedo, false)
  })

  test('undo with nothing to undo is a no-op, and the stack is bounded', () => {
    const h = createHistory({ limit: 3 })
    assert.equal(h.undo('x'), null)
    for (let i = 0; i < 10; i++) h.record(i, { now: i * 10_000 })
    let n = 0
    while (h.undo('s') !== null) n++
    assert.equal(n, 3)
  })
})

describe('section order', () => {
  const base = () => normalizeData({})

  test('the default order is the built-in sections', () => {
    assert.deepEqual(resolveOrder(base()), NATIVE_SECTIONS)
  })

  test('a custom section is added at the end and an arranged order is honoured', () => {
    const data = base()
    const section = blankCustomSection('Awards')
    data.custom = [section]
    assert.equal(resolveOrder(data).at(-1), customKey(section.id))
    data.order = [customKey(section.id), 'skills']
    const order = resolveOrder(data)
    assert.deepEqual(order.slice(0, 2), [customKey(section.id), 'skills'])
    assert.equal(new Set(order).size, order.length, 'no duplicates')
    assert.equal(order.length, NATIVE_SECTIONS.length + 1, 'nothing is lost')
  })

  test('a stale order can never hide or duplicate a section', () => {
    const data = base()
    data.order = ['skills', 'skills', 'custom:gone', 'nonsense', 'summary']
    const order = resolveOrder(data)
    assert.deepEqual(order, ['skills', 'summary', ...NATIVE_SECTIONS.filter((k) => k !== 'skills' && k !== 'summary')])
  })

  test('move and duplicate', () => {
    assert.deepEqual(move(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a'])
    assert.deepEqual(move(['a', 'b'], 0, 5), ['a', 'b'], 'out of range is ignored')
    const section = blankCustomSection('Awards')
    const copy = duplicate(section)
    assert.notEqual(copy.id, section.id)
    assert.notEqual(copy.entries[0].id, section.entries[0].id)
    assert.equal(copy.title, 'Awards (copy)')
  })

  test('normalizeData fills in everything an older resume lacks', () => {
    const data = normalizeData({ summary: 'x', experience: [{ id: '1' }] })
    assert.deepEqual(data.custom, [])
    assert.deepEqual(data.languages, [])
    assert.deepEqual(data.order, [])
    assert.deepEqual(data.style, { size: 'md', spacing: 'normal' })
    assert.equal(data.contact.email, '')
    assert.equal(data.experience.length, 1)
  })
})

describe('combined and repeated marks', () => {
  test('*** is bold and italic at once', () => {
    const [b] = parseInline('***both***')
    assert.equal(b.type, 'b')
    assert.equal(b.children[0].type, 'i')
    assert.equal(stripMarks('***both***'), 'both')
  })

  test('bold and italic still work side by side', () => {
    const nodes = parseInline('**a** and *b*')
    assert.deepEqual(nodes.map((n) => n.type), ['b', 'text', 'i'])
  })
})

// A minimal stand-in for the DOM: enough for markersFromDom, which reads only
// node type, name, value, children and inline style.
const t = (v) => ({ nodeType: 3, nodeName: '#text', nodeValue: v, childNodes: [] })
const el = (name, children = [], style = {}) => ({ nodeType: 1, nodeName: name, childNodes: children, style })
const root = (...children) => el('DIV', children)

describe('editor to stored text', () => {
  test('bold, italic and underline become markers', () => {
    assert.equal(markersFromDom(root(el('DIV', [t('a '), el('B', [t('b')]), t(' '), el('I', [t('c')]), t(' '), el('U', [t('d')])]))), 'a **b** *c* ++d++')
  })

  test('strong, em and inline styles count the same as b, i and u', () => {
    assert.equal(markersFromDom(root(el('DIV', [el('STRONG', [t('x')]), t(' '), el('SPAN', [t('y')], { fontWeight: '700' }), t(' '), el('EM', [t('z')])]))), '**x** **y** *z*')
  })

  test('nested marks stack: bold italic is ***', () => {
    assert.equal(markersFromDom(root(el('DIV', [el('B', [el('I', [t('both')])])]))), '***both***')
  })

  test('spaces inside a mark move outside it so the markers still parse', () => {
    const out = markersFromDom(root(el('DIV', [t('go'), el('B', [t(' bold ')]), t('on')])))
    assert.equal(out, 'go **bold** on')
    assert.equal(stripMarks(out), 'go bold on')
  })

  test('a mark around nothing but space vanishes', () => {
    assert.equal(markersFromDom(root(el('DIV', [t('a'), el('B', [t(' ')]), t('b')]))), 'a b')
  })

  test('two runs the browser left side by side join up', () => {
    assert.equal(markersFromDom(root(el('DIV', [el('B', [t('one')]), el('B', [t('two')])]))), '**onetwo**')
  })

  test('lists become "- " and "1. " lines', () => {
    const out = markersFromDom(root(el('UL', [el('LI', [t('a')]), el('LI', [t('b')])]), el('OL', [el('LI', [t('c')]), el('LI', [t('d')])])))
    assert.equal(out, '- a\n- b\n1. c\n2. d')
  })

  test('lines, empty lines and a bare first line', () => {
    assert.equal(markersFromDom(root(t('first'), el('DIV', [t('second')]), el('DIV', [el('BR')]), el('DIV', [t('fourth')]))), 'first\nsecond\n\nfourth')
  })

  test('the placeholder <br> in an empty editor is no text at all', () => {
    assert.equal(markersFromDom(root()), '')
    assert.equal(markersFromDom(root(el('BR'))), '')
    assert.equal(markersFromDom(root(el('DIV', [el('BR')]))), '')
  })

  test('non-breaking spaces become spaces and markup is only ever text', () => {
    assert.equal(markersFromDom(root(el('DIV', [t('a\u00a0b <script>')]))), 'a b <script>')
  })

  test('what the editor stores reads back the same', () => {
    const text = 'Led a **team of 5** to ship *fast*'
    const dom = root(el('DIV', [t('Led a '), el('B', [t('team of 5')]), t(' to ship '), el('I', [t('fast')])]))
    assert.equal(markersFromDom(dom), text)
    assert.equal(stripMarks(text), 'Led a team of 5 to ship fast')
  })
})
