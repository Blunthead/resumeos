import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { withSample } from '../src/lib/preview.js'
import { SAMPLE, normalizeData } from '../src/lib/resume.js'

const none = () => new Set()

describe('sample content in the preview', () => {
  test('a blank resume is shown as the full sample, all of it faded', () => {
    const { data, ghost } = withSample(normalizeData({}), none())
    assert.equal(data.contact.fullName, SAMPLE.contact.fullName)
    assert.equal(data.experience.length, SAMPLE.experience.length)
    for (const id of ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'contact.fullName', 'contact.email']) {
      assert.ok(ghost.has(id), id)
    }
  })

  test('one typed letter replaces one line and nothing else', () => {
    const input = normalizeData({ contact: { fullName: 'b' } })
    const { data, ghost } = withSample(input, none())
    assert.equal(data.contact.fullName, 'b')
    assert.ok(!ghost.has('contact.fullName'))
    assert.ok(ghost.has('contact.email'))
    assert.equal(data.experience.length, SAMPLE.experience.length, 'the rest of the page is still there')
  })

  test("the person's own sections are never replaced", () => {
    const mine = [{ id: 'x', role: 'Chef', company: 'Cafe', location: '', startDate: '', endDate: '', description: 'Cooked' }]
    const { data, ghost } = withSample(normalizeData({ experience: mine, summary: 'Hello' }), none())
    assert.deepEqual(data.experience, mine)
    assert.equal(data.summary, 'Hello')
    assert.ok(!ghost.has('experience') && !ghost.has('summary'))
  })

  test('a section left empty on purpose stops being filled in', () => {
    const { data, ghost } = withSample(normalizeData({}), new Set(['experience', 'contact']))
    assert.equal(data.experience.length, 0)
    assert.equal(data.contact.email, '')
    assert.ok(!ghost.has('experience'))
    assert.ok(ghost.has('projects'), 'sections not visited yet are still shown as samples')
  })

  test('the input is not changed, and style survives', () => {
    const input = normalizeData({ style: { size: 'lg', spacing: 'tight' } })
    const before = JSON.stringify(input)
    const { data } = withSample(input, none())
    assert.equal(JSON.stringify(input), before)
    assert.deepEqual(data.style, { size: 'lg', spacing: 'tight' })
  })
})
