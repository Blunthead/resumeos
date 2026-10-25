import { AddButton, ChipInput, Field, ItemCard, TextArea } from './Fields.jsx'
import { blankEducation, blankExperience, blankProject } from '../../lib/resume.js'

// Each step edits one slice of the resume. `data` is the whole resume content;
// `onData(fn)` applies fn(data) -> newData, so steps never mutate state.

function ListStep({ items, onItems, blank, addLabel, render, itemTitle }) {
  const patch = (id, change) => onItems(items.map((it) => (it.id === id ? { ...it, ...change } : it)))
  const remove = (id) => onItems(items.filter((it) => it.id !== id))
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <ItemCard key={item.id} title={itemTitle(item, i)} onRemove={() => remove(item.id)}>
          {render(item, (change) => patch(item.id, change))}
        </ItemCard>
      ))}
      <AddButton onClick={() => onItems([...items, blank()])}>{addLabel}</AddButton>
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
    <TextArea
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
          <TextArea
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
      itemTitle={(p, i) => p.name || `Project ${i + 1}`}
      render={(p, set) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project name" value={p.name} onChange={(v) => set({ name: v })} placeholder="Trailmap" />
            <Field label="Link" value={p.link} onChange={(v) => set({ link: v })} placeholder="github.com/you/project" />
          </div>
          <TextArea
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
      itemTitle={(e, i) => e.degree || e.school || `Education ${i + 1}`}
      render={(e, set) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Degree" value={e.degree} onChange={(v) => set({ degree: v })} placeholder="B.S. Computer Science" />
          <Field label="School" value={e.school} onChange={(v) => set({ school: v })} placeholder="University name" />
          <Field label="Start" value={e.startDate} onChange={(v) => set({ startDate: v })} placeholder="2016" />
          <Field label="End" value={e.endDate} onChange={(v) => set({ endDate: v })} placeholder="2020" />
          <div className="sm:col-span-2">
            <TextArea
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
      max={30}
    />
  )
}
