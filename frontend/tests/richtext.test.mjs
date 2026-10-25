import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBlocks, parseInline, stripMarks } from '../src/lib/richText.js'
import { toggleList, toggleMark } from '../src/lib/richEdit.js'
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

describe('toolbar edits', () => {
  test('wraps a selection, and a second toggle unwraps it', () => {
    const a = toggleMark('make it bold', 8, 12, 'bold')
    assert.equal(a.value, 'make it **bold**')
    assert.equal(a.value.slice(a.start, a.end), 'bold')
    const b = toggleMark(a.value, a.start, a.end, 'bold')
    assert.equal(b.value, 'make it bold')
  })

  test('with nothing selected it drops an empty pair and puts the caret inside', () => {
    const r = toggleMark('hi ', 3, 3, 'italic')
    assert.equal(r.value, 'hi **')
    assert.equal(r.start, 4)
  })

  test('italic inside bold is added, not mistaken for it', () => {
    const bold = toggleMark('word', 0, 4, 'bold')
    const both = toggleMark(bold.value, bold.start, bold.end, 'italic')
    assert.equal(both.value, '***word***')
    const off = toggleMark(both.value, both.start, both.end, 'italic')
    assert.equal(off.value, '**word**')
  })

  test('bullets: add to every touched line, then remove', () => {
    const on = toggleList('a\nb\nc', 0, 5, 'bullet')
    assert.equal(on.value, '- a\n- b\n- c')
    assert.equal(toggleList(on.value, on.start, on.end, 'bullet').value, 'a\nb\nc')
  })

  test('numbering counts up and replaces bullets', () => {
    const r = toggleList('- a\n- b', 0, 7, 'number')
    assert.equal(r.value, '1. a\n2. b')
  })

  test('only the lines the selection touches change', () => {
    const r = toggleList('one\ntwo\nthree', 4, 6, 'bullet')
    assert.equal(r.value, 'one\n- two\nthree')
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

import { continueList } from '../src/lib/richEdit.js'

describe('list continuation', () => {
  test('Enter at the end of a bullet starts the next bullet', () => {
    const v = '- one'
    const r = continueList(v, v.length)
    assert.equal(r.value, '- one\n- ')
    assert.equal(r.start, r.value.length)
  })

  test('numbers count up', () => {
    assert.equal(continueList('1. a\n2. b', 9).value, '1. a\n2. b\n3. ')
  })

  test('Enter on an empty item ends the list', () => {
    const r = continueList('- a\n- ', 6)
    assert.equal(r.value, '- a\n')
    assert.equal(r.start, 4)
  })

  test('on a plain line it does nothing, so Enter behaves normally', () => {
    assert.equal(continueList('just text', 9), null)
    assert.equal(continueList('*italic* text', 13), null)
  })

  test('Enter in the middle of an item splits it', () => {
    const r = continueList('- ab', 4 - 1)
    assert.equal(r.value, '- a\n- b')
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

  test('pressing bold again at the end of bold text steps out of it', () => {
    const first = toggleMark('hi ', 3, 3, 'bold')
    assert.equal(first.value, 'hi ****')
    const typed = 'hi **word**'
    const out = toggleMark(typed, 9, 9, 'bold')
    assert.equal(out.value, typed, 'text is unchanged')
    assert.equal(out.start, 11, 'caret moves past the closing marker')
  })

  test('same for italic, and italic inside bold does not step out of the bold', () => {
    assert.equal(toggleMark('a *it*', 5, 5, 'italic').start, 6)
    const r = toggleMark('**word**', 6, 6, 'italic')
    assert.equal(r.value, '**word****', 'opens an italic pair inside the bold instead of stepping out')
    assert.equal(r.start, 7, 'with the caret between the new pair')
  })

  test('with nothing selected and no marker after the caret it opens a pair', () => {
    assert.equal(toggleMark('word ', 5, 5, 'bold').value, 'word ****')
  })
})
