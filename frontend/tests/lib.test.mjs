import { afterEach, describe, mock, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ACCENTS,
  SAMPLE,
  TEMPLATES,
  accentOf,
  blankEducation,
  blankExperience,
  blankProject,
  isEmptyResume,
  layoutOf,
  toBullets,
} from '../src/lib/resume.js'
import { handoff } from '../src/lib/handoff.js'

describe('templates', () => {
  test('ids are unique and every template has an accent that is also pickable', () => {
    const ids = TEMPLATES.map((t) => t.id)
    assert.equal(new Set(ids).size, ids.length)
    for (const t of TEMPLATES) {
      assert.match(t.accent, /^#[0-9a-f]{6}$/i)
      assert.ok(ACCENTS.includes(t.accent), `${t.id}'s colour must be in the picker`)
    }
  })

  test('layoutOf and accentOf fall back safely for an unknown template', () => {
    assert.equal(layoutOf('sidebar'), 'sidebar')
    assert.equal(layoutOf('modern'), 'single')
    assert.equal(layoutOf('nope'), 'single')
    assert.equal(accentOf('nope'), '#3d5a80')
  })
})

describe('resume helpers', () => {
  test('toBullets splits lines, trims, drops blanks and leading bullet marks', () => {
    assert.deepEqual(toBullets('  one \n\n- two\n• three\r\n* four '), ['one', 'two', 'three', 'four'])
    assert.deepEqual(toBullets(''), [])
  })

  test('isEmptyResume is true for a blank resume and false once anything is filled in', () => {
    const blank = {
      contact: { fullName: '', jobTitle: '', email: '', phone: '', location: '', website: '', linkedin: '' },
      summary: '',
      experience: [],
      education: [],
      projects: [],
      skills: [],
      certifications: [],
    }
    assert.equal(isEmptyResume(blank), true)
    assert.equal(isEmptyResume({ ...blank, summary: '  ' }), true, 'whitespace does not count')
    assert.equal(isEmptyResume({ ...blank, skills: ['x'] }), false)
    assert.equal(isEmptyResume({ ...blank, contact: { ...blank.contact, fullName: 'A' } }), false)
    assert.equal(isEmptyResume(SAMPLE), false)
  })

  test('new list entries each get their own id', () => {
    const ids = [blankExperience(), blankExperience(), blankEducation(), blankProject()].map((e) => e.id)
    assert.equal(new Set(ids).size, ids.length)
  })
})

describe('handoff', () => {
  afterEach(() => mock.timers.reset())

  test('hands a created resume to the editor once, then it is gone after drop', () => {
    handoff.put({ _id: 'a1', title: 'x' })
    assert.equal(handoff.peek('a1').title, 'x')
    assert.equal(handoff.peek('a1').title, 'x', 'peeking does not consume it')
    handoff.drop('a1')
    assert.equal(handoff.peek('a1'), null)
  })

  test('an unknown id is simply absent', () => {
    assert.equal(handoff.peek('never-put'), null)
  })

  test('an entry expires, so a forgotten one can never be served stale', () => {
    mock.timers.enable({ apis: ['Date'], now: 1_000_000 })
    handoff.put({ _id: 'b2' })
    mock.timers.tick(14_000)
    assert.ok(handoff.peek('b2'))
    mock.timers.tick(2_000)
    assert.equal(handoff.peek('b2'), null)
  })
})
