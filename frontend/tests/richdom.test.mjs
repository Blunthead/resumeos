import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { markersFromDom } from '../src/lib/richDom.js'
import { parseInline, stripMarks } from '../src/lib/richText.js'

const t = (v) => ({ nodeType: 3, nodeName: '#text', nodeValue: v, childNodes: [] })
const el = (name, children = [], style = {}) => ({ nodeType: 1, nodeName: name, childNodes: children, style })
const root = (...children) => el('DIV', children)

describe('typed symbols stay literal', () => {
  test('asterisks and doubled plus signs are escaped on the way out', () => {
    assert.equal(markersFromDom(root(el('DIV', [t('rated *very* high')]))), 'rated \\*very\\* high')
    assert.equal(markersFromDom(root(el('DIV', [t('C++ and 5 * 3')]))), 'C\\+\\+ and 5 \\* 3')
    assert.equal(markersFromDom(root(el('DIV', [t('one + two')]))), 'one + two')
  })

  test('and read back exactly as typed', () => {
    for (const text of ['rated *very* high', 'C++ and C++', '5 * 3 = 15', 'a \\ b', '**not bold**', '++not underlined++', 'trail\\']) {
      const stored = markersFromDom(root(el('DIV', [t(text)])))
      assert.equal(stripMarks(stored), text, text)
      assert.ok(parseInline(stored).every((n) => n.type === 'text'), `${text} must stay plain text`)
    }
  })

  test('a real bold next to typed stars keeps both', () => {
    const stored = markersFromDom(root(el('DIV', [el('B', [t('bold')]), t(' and *star*')])))
    assert.equal(stored, '**bold** and \\*star\\*')
    assert.equal(stripMarks(stored), 'bold and *star*')
  })

  test('old text with a stray backslash is left alone', () => {
    assert.equal(stripMarks('C:\\temp\\file'), 'C:\\temp\\file')
  })
})

describe('structure the browser builds', () => {
  test('a list inside the first line, followed by a plain line', () => {
    const dom = root(el('DIV', [el('UL', [el('LI', [t('one')])]), el('DIV', [t('plain')])]))
    assert.equal(markersFromDom(dom), '- one\nplain')
  })

  test('a newline inside text is a line break (Shift+Enter)', () => {
    assert.equal(markersFromDom(root(el('DIV', [t('a\nb')]))), 'a\nb')
  })
})
