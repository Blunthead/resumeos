import { memo } from 'react'
import './resumeDocument.css'
import { layoutOf, toBullets } from '../lib/resume.js'

function Dates({ start, end }) {
  const text = [start, end].filter(Boolean).join(' – ')
  return text ? <span className="rd-meta">{text}</span> : null
}

function Section({ title, children }) {
  return (
    <section className="rd-section">
      <h2 className="rd-h">{title}</h2>
      {children}
    </section>
  )
}

function Bullets({ text }) {
  const items = toBullets(text)
  if (!items.length) return null
  return (
    <ul className="rd-list">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

// Pure and style-only: the same markup is shown on screen and sent to the
// server for the PDF, so the download always matches the preview.
// Real headings and lists throughout — what applicant tracking systems parse
// best. 'single' stacks everything in one column; 'sidebar' moves contact,
// skills, education and certifications into a side panel.
function ResumeDocument({ data, template, accent }) {
  const layout = layoutOf(template)
  const c = data.contact
  const contactItems = [c.email, c.phone, c.location, c.website, c.linkedin].filter(Boolean)

  const header = (
    <header className="rd-header">
      <div className="rd-id">
        {c.fullName && <h1 className="rd-name">{c.fullName}</h1>}
        {c.jobTitle && <p className="rd-jobtitle">{c.jobTitle}</p>}
      </div>
      {layout === 'single' && contactItems.length > 0 && (
        <p className="rd-contact">
          {contactItems.map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </p>
      )}
    </header>
  )

  const contact =
    contactItems.length > 0 ? (
      <Section title="Contact">
        <ul className="rd-clist">
          {contactItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>
    ) : null

  const summary = data.summary.trim() ? (
    <Section title="Summary">
      <p className="rd-text">{data.summary}</p>
    </Section>
  ) : null

  const experience = data.experience.length ? (
    <Section title="Experience">
      {data.experience.map((job) => (
        <div className="rd-entry" key={job.id}>
          <div className="rd-row">
            <span className="rd-strong">{job.role}</span>
            <Dates start={job.startDate} end={job.endDate} />
          </div>
          {(job.company || job.location) && (
            <div className="rd-sub">{[job.company, job.location].filter(Boolean).join(' · ')}</div>
          )}
          <Bullets text={job.description} />
        </div>
      ))}
    </Section>
  ) : null

  const projects = data.projects.length ? (
    <Section title="Projects">
      {data.projects.map((p) => (
        <div className="rd-entry" key={p.id}>
          <div className="rd-row">
            <span className="rd-strong">{p.name}</span>
            {p.link && <span className="rd-meta">{p.link}</span>}
          </div>
          <Bullets text={p.description} />
        </div>
      ))}
    </Section>
  ) : null

  const education = data.education.length ? (
    <Section title="Education">
      {data.education.map((e) => (
        <div className="rd-entry" key={e.id}>
          <div className="rd-row">
            <span className="rd-strong">{e.degree}</span>
            <Dates start={e.startDate} end={e.endDate} />
          </div>
          {(e.school || e.location) && (
            <div className="rd-sub">{[e.school, e.location].filter(Boolean).join(' · ')}</div>
          )}
          <Bullets text={e.details} />
        </div>
      ))}
    </Section>
  ) : null

  const skills = data.skills.length ? (
    <Section title="Skills">
      <ul className="rd-skills">
        {data.skills.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </Section>
  ) : null

  const certifications = data.certifications.length ? (
    <Section title="Certifications">
      <ul className="rd-list">
        {data.certifications.map((cert, i) => (
          <li key={i}>{cert}</li>
        ))}
      </ul>
    </Section>
  ) : null

  return (
    <div className="rd" data-template={template} data-layout={layout} style={{ '--rd-accent': accent }}>
      {layout === 'sidebar' ? (
        <div className="rd-grid">
          <aside className="rd-side">
            {contact}
            {skills}
            {education}
            {certifications}
          </aside>
          <div className="rd-main">
            {header}
            {summary}
            {experience}
            {projects}
          </div>
        </div>
      ) : (
        <>
          {header}
          {summary}
          {experience}
          {projects}
          {education}
          {skills}
          {certifications}
        </>
      )}
    </div>
  )
}

// Many previews can be on screen at once (the template gallery shows fourteen),
// and the editor re-renders on every keystroke. A preview whose data, template
// and colour haven't changed has nothing to redraw.
export default memo(ResumeDocument)
