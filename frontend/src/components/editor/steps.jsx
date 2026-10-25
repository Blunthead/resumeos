import { useState } from 'react'
import { AddButton, ChipInput, Field, ItemCard, RichTextArea } from './Fields.jsx'
import { useSortable } from './sortable.js'
import {
  LIMITS,
  blankCustomEntry,
  blankEducation,
  blankExperience,
  blankProject,
} from '../../lib/resume.js'
import { customKey, duplicate, move, resolveOrder } from '../../lib/sections.js'

// Each step edits one slice of the resume. `data` is the whole resume content;
// `onData(fn)` applies fn(data) -> newData, so steps never mutate state.

// A reorderable list of cards: drag, arrows, duplicate, collapse, remove.
function ListStep({ items, onItems, blank, addLabel, render, itemTitle, max = 30 }) {
  const sort = useSortable((from, to) => onItems(move(items, from, to)))
  const patch = (id, change) => onItems(items.map((it) => (it.id === id ? { ...it, ...change } : it)))
  const remove = (id) => onItems(items.filter((it) => it.id !== id))
  const copy = (i) => onItems([...items.slice(0, i + 1), duplicate(items[i]), ...items.slice(i + 1)])
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <ItemCard
          key={item.id}
          sort={sort}
          index={i}
          count={items.length}
          title={itemTitle(item, i)}
          onMove={(to) => onItems(move(items, i, to))}
          onDuplicate={() => copy(i)}
          onRemove={() => remove(item.id)}
        >
          {render(item, (change) => patch(item.id, change))}
        </ItemCard>
      ))}
      <AddButton onClick={() => onItems([...items, blank()])} disabled={items.length >= max}>
        {items.length >= max ? `That's the maximum (${max})` : addLabel}
      </AddButton>
    </div>
  )
}

export function ContactStep({ data, onData }) {
  const c = data.contact
  const set = (key) => (value) => onData((d) => ({ ...d, contact: { ...d.contact, [key]: value } }))
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" value={c.fullName} onChange={set('fullName')} placeholder="Alex Morgan" />
      <Field label="Job title" value={c.jobTitle} onChange={set('jobTitle')} placeholder="Software Engineer" />
      <Field label="Email" type="email" value={c.email} onChange={set('email')} placeholder="alex@example.com" />
      <Field label="Phone" type="tel" value={c.phone} onChange={set('phone')} placeholder="+1 555 010 2030" />
      <Field label="Location" value={c.location} onChange={set('location')} placeholder="City, Country" />
      <Field label="Website" value={c.website} onChange={set('website')} placeholder="yoursite.com" />
      <div className="sm:col-span-2">
        <Field label="LinkedIn" value={c.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/you" />
      </div>
    </div>
  )
}

export function SummaryStep({ data, onData }) {
  return (
    <RichTextArea
      label="Summary"
      rows={6}
      value={data.summary}
      onChange={(v) => onData((d) => ({ ...d, summary: v }))}
      placeholder="Two or three sentences on who you are and what you're good at."
      hint="Keep it short. You can always leave this blank."
    />
  )
}

export function ExperienceStep({ data, onData }) {
  return (
    <ListStep
      items={data.experience}
      onItems={(experience) => onData((d) => ({ ...d, experience }))}
      blank={blankExperience}
      addLabel="Add a job"
      max={30}
      itemTitle={(j, i) => j.role || j.company || `Job ${i + 1}`}
      render={(j, set) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title" value={j.role} onChange={(v) => set({ role: v })} placeholder="Software Engineer" />
            <Field label="Company" value={j.company} onChange={(v) => set({ company: v })} placeholder="Brightline" />
            <Field label="Start" value={j.startDate} onChange={(v) => set({ startDate: v })} placeholder="Jun 2022" />
            <Field label="End" value={j.endDate} onChange={(v) => set({ endDate: v })} placeholder="Present" />
            <div className="sm:col-span-2">
              <Field label="Location" value={j.location} onChange={(v) => set({ location: v })} placeholder="City, Country" />
            </div>
          </div>
          <RichTextArea
            label="What did you do?"
            rows={5}
            value={j.description}
            onChange={(v) => set({ description: v })}
            placeholder={'Cut page load time by 40%\nLed a team of 3 to ship the new dashboard'}
            hint="One achievement per line. Numbers help."
          />
        </>
      )}
    />
  )
}

export function ProjectsStep({ data, onData }) {
  return (
    <ListStep
      items={data.projects}
      onItems={(projects) => onData((d) => ({ ...d, projects }))}
      blank={blankProject}
      addLabel="Add a project"
      max={20}
      itemTitle={(p, i) => p.name || `Project ${i + 1}`}
      render={(p, set) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project name" value={p.name} onChange={(v) => set({ name: v })} placeholder="Trailmap" />
            <Field label="Link" value={p.link} onChange={(v) => set({ link: v })} placeholder="github.com/you/project" />
          </div>
          <RichTextArea
            label="What is it?"
            rows={3}
            value={p.description}
            onChange={(v) => set({ description: v })}
            placeholder="A hiking route planner used by 1,000+ people"
            hint="One point per line."
          />
        </>
      )}
    />
  )
}

export function EducationStep({ data, onData }) {
  return (
    <ListStep
      items={data.education}
      onItems={(education) => onData((d) => ({ ...d, education }))}
      blank={blankEducation}
      addLabel="Add education"
      max={15}
      itemTitle={(e, i) => e.degree || e.school || `Education ${i + 1}`}
      render={(e, set) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Degree" value={e.degree} onChange={(v) => set({ degree: v })} placeholder="B.S. Computer Science" />
          <Field label="School" value={e.school} onChange={(v) => set({ school: v })} placeholder="University name" />
          <Field label="Start" value={e.startDate} onChange={(v) => set({ startDate: v })} placeholder="2016" />
          <Field label="End" value={e.endDate} onChange={(v) => set({ endDate: v })} placeholder="2020" />
          <div className="sm:col-span-2">
            <RichTextArea
              label="Details (optional)"
              rows={2}
              value={e.details}
              onChange={(v) => set({ details: v })}
              placeholder="CGPA 8.7, Dean's list"
            />
          </div>
        </div>
      )}
    />
  )
}

export function SkillsStep({ data, onData }) {
  return (
    <ChipInput
      label="Your skills"
      values={data.skills}
      onChange={(skills) => onData((d) => ({ ...d, skills }))}
      placeholder="e.g. React, Project management"
      max={LIMITS.skills}
    />
  )
}

export function CertificationsStep({ data, onData }) {
  return (
    <ChipInput
      label="Certifications"
      values={data.certifications}
      onChange={(certifications) => onData((d) => ({ ...d, certifications }))}
      placeholder="e.g. AWS Certified Developer"
      max={LIMITS.certifications}
    />
  )
}

export function LanguagesStep({ data, onData }) {
  return (
    <ChipInput
      label="Languages"
      values={data.languages}
      onChange={(languages) => onData((d) => ({ ...d, languages }))}
      placeholder="e.g. English — Native"
      max={LIMITS.languages}
    />
  )
}

// A section the user created: a title and a list of entries.
export function CustomStep({ data, onData, onOpen, sectionId }) {
  const section = data.custom.find((c) => c.id === sectionId)
  const [confirming, setConfirming] = useState(false)
  if (!section) return null

  const update = (fn) => onData((d) => ({ ...d, custom: d.custom.map((c) => (c.id === sectionId ? fn(c) : c)) }))

  const copySection = () => {
    const copy = duplicate(section)
    onData((d) => {
      const at = d.custom.findIndex((c) => c.id === sectionId)
      const order = resolveOrder(d)
      order.splice(order.indexOf(customKey(sectionId)) + 1, 0, customKey(copy.id))
      return { ...d, custom: [...d.custom.slice(0, at + 1), copy, ...d.custom.slice(at + 1)], order }
    })
    onOpen(customKey(copy.id))
  }

  const removeSection = () => {
    onData((d) => ({
      ...d,
      custom: d.custom.filter((c) => c.id !== sectionId),
      order: resolveOrder(d).filter((k) => k !== customKey(sectionId)),
    }))
  }

  return (
    <div className="space-y-5">
      <Field
        label="Section title"
        value={section.title}
        maxLength={60}
        onChange={(title) => update((c) => ({ ...c, title }))}
        placeholder="e.g. Volunteer Work"
        hint="This is the heading on your resume."
      />
      <ListStep
        items={section.entries}
        onItems={(entries) => update((c) => ({ ...c, entries }))}
        blank={blankCustomEntry}
        addLabel="Add an entry"
        max={LIMITS.customEntries}
        itemTitle={(e, i) => e.title || e.subtitle || `Entry ${i + 1}`}
        render={(e, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" value={e.title} onChange={(v) => set({ title: v })} placeholder="Mentor, Code for Good" />
              <Field label="Date" value={e.date} onChange={(v) => set({ date: v })} placeholder="2023 – Present" />
              <div className="sm:col-span-2">
                <Field label="Subtitle (optional)" value={e.subtitle} onChange={(v) => set({ subtitle: v })} placeholder="Organisation or place" />
              </div>
            </div>
            <RichTextArea
              label="Details (optional)"
              rows={3}
              value={e.description}
              onChange={(v) => set({ description: v })}
              placeholder="What you did, in a line or two."
              hint="Use the list buttons for bullets."
            />
          </>
        )}
      />
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={copySection}
          disabled={data.custom.length >= LIMITS.customSections}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
        >
          Duplicate section
        </button>
        {confirming ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="text-slate-700">Delete “{section.title || 'this section'}”?</span>
            <button type="button" onClick={removeSection} className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700">
              Delete
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100">
              Keep
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
            Delete section
          </button>
        )}
      </div>
    </div>
  )
}
