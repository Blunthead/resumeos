import { Fragment, memo } from 'react'
import './resumeDocument.css'
import { layoutOf } from '../lib/resume.js'
import { parseBlocks } from '../lib/richText.js'
import { SECTION_LABEL, customIdOf, inSidebar, isCustomKey, resolveOrder } from '../lib/sections.js'

// Text size and line spacing are multipliers on each template's own values, so
// every template scales the same way and the PDF gets the same numbers.
const SIZE_SCALE = { sm: 0.93, md: 1, lg: 1.08 }
const SPACING_MUL = { tight: 0.9, normal: 1, relaxed: 1.12 }

function Inline({ nodes }) {
  return nodes.map((n, i) => {
    if (n.type === 'text') return n.value
    const children = <Inline nodes={n.children} />
    if (n.type === 'b') return <strong key={i}>{children}</strong>
    if (n.type === 'i') return <em key={i}>{children}</em>
    return <u key={i}>{children}</u>
  })
}

// `bullets`: every unmarked line is a bullet (job and project descriptions).
// Otherwise unmarked lines are paragraphs (summary, custom entries).
function Rich({ text, bullets = false }) {
  const blocks = parseBlocks(text, { bullets })
  if (!blocks.length) return null
  return blocks.map((b, i) => {
    if (b.type === 'p') {
      return (
        <p className="rd-text" key={i}>
          <Inline nodes={b.content} />
        </p>
      )
    }
    const List = b.type === 'ol' ? 'ol' : 'ul'
    return (
      <List className={b.type === 'ol' ? 'rd-list rd-ol' : 'rd-list'} key={i}>
        {b.items.map((item, j) => (
          <li key={j}>
            <Inline nodes={item} />
          </li>
        ))}
      </List>
    )
  })
}

function Dates({ start, end }) {
  const text = [start, end].filter(Boolean).join(' – ')
  return text ? <span className="rd-meta">{text}</span> : null
}

// `data-section` is what the editor listens for: clicking a section in the
// preview opens its form. It carries no style, so it prints as nothing.
function Section({ id, title, children }) {
  return (
    <section className="rd-section" data-section={id}>
      <h2 className="rd-h">{title}</h2>
      {children}
    </section>
  )
}

function Entry({ title, meta, sub, children }) {
  return (
    <div className="rd-entry">
      <div className="rd-row">
        <span className="rd-strong">{title}</span>
        {meta}
      </div>
      {sub ? <div className="rd-sub">{sub}</div> : null}
      {children}
    </div>
  )
}

const join = (...parts) => parts.filter(Boolean).join(' · ')

// Pure and style-only: the same markup is shown on screen and sent to the
// server for the PDF, so the download always matches the preview.
// Real headings and lists throughout — what applicant tracking systems parse
// best. 'single' stacks everything in one column; 'sidebar' moves contact,
// skills, education, certifications and languages into a side panel.
function ResumeDocument({ data, template, accent }) {
  const layout = layoutOf(template)
  const c = data.contact
  const custom = data.custom ?? []
  const style = data.style ?? {}
  const order = resolveOrder({ custom, order: data.order ?? [] })
  const contactItems = [c.email, c.phone, c.location, c.website, c.linkedin].filter(Boolean)

  const header = (
    <div className="rd-header" data-section="contact">
      <div className="rd-id">
        {c.fullName && <h1 className="rd-name">{c.fullName}</h1>}
        {c.jobTitle && <p className="rd-jobtitle">{c.jobTitle}</p>}
      </div>
      {layout === 'single' && contactItems.length > 0 && (
        <p className="rd-contact">
          {contactItems.map((item, i) => (
            <Fragment key={i}>
              {i > 0 && ' '}
              <span>{item}</span>
            </Fragment>
          ))}
        </p>
      )}
    </div>
  )

  const contact =
    contactItems.length > 0 ? (
      <Section id="contact" title="Contact">
        <ul className="rd-clist">
          {contactItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>
    ) : null

  const renderers = {
    summary: () =>
      data.summary.trim() ? (
        <Section id="summary" title={SECTION_LABEL.summary} key="summary">
          <Rich text={data.summary} />
        </Section>
      ) : null,
    experience: () =>
      data.experience.length ? (
        <Section id="experience" title={SECTION_LABEL.experience} key="experience">
          {data.experience.map((job) => (
            <Entry
              key={job.id}
              title={job.role}
              meta={<Dates start={job.startDate} end={job.endDate} />}
              sub={join(job.company, job.location)}
            >
              <Rich text={job.description} bullets />
            </Entry>
          ))}
        </Section>
      ) : null,
    projects: () =>
      data.projects.length ? (
        <Section id="projects" title={SECTION_LABEL.projects} key="projects">
          {data.projects.map((p) => (
            <Entry key={p.id} title={p.name} meta={p.link ? <span className="rd-meta rd-link">{p.link}</span> : null}>
              <Rich text={p.description} bullets />
            </Entry>
          ))}
        </Section>
      ) : null,
    education: () =>
      data.education.length ? (
        <Section id="education" title={SECTION_LABEL.education} key="education">
          {data.education.map((e) => (
            <Entry
              key={e.id}
              title={e.degree}
              meta={<Dates start={e.startDate} end={e.endDate} />}
              sub={join(e.school, e.location)}
            >
              <Rich text={e.details} bullets />
            </Entry>
          ))}
        </Section>
      ) : null,
    skills: () =>
      data.skills.length ? (
        <Section id="skills" title={SECTION_LABEL.skills} key="skills">
          <ul className={data.skills.length > 14 ? 'rd-skills rd-skills-many' : 'rd-skills'}>
            {data.skills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      ) : null,
    certifications: () =>
      data.certifications.length ? (
        <Section id="certifications" title={SECTION_LABEL.certifications} key="certifications">
          <ul className="rd-list">
            {data.certifications.map((cert, i) => (
              <li key={i}>{cert}</li>
            ))}
          </ul>
        </Section>
      ) : null,
    languages: () =>
      (data.languages ?? []).length ? (
        <Section id="languages" title={SECTION_LABEL.languages} key="languages">
          <ul className="rd-list">
            {data.languages.map((lang, i) => (
              <li key={i}>{lang}</li>
            ))}
          </ul>
        </Section>
      ) : null,
  }

  const render = (key) => {
    if (isCustomKey(key)) {
      const section = custom.find((s) => s.id === customIdOf(key))
      if (!section || !section.title.trim() || !section.entries.length) return null
      return (
        <Section id={key} title={section.title} key={key}>
          {section.entries.map((entry) => (
            <Entry
              key={entry.id}
              title={entry.title}
              meta={entry.date ? <span className="rd-meta">{entry.date}</span> : null}
              sub={entry.subtitle}
            >
              <Rich text={entry.description} />
            </Entry>
          ))}
        </Section>
      )
    }
    return renderers[key]()
  }

  const root = (children) => (
    <div
      className="rd"
      data-template={template}
      data-layout={layout}
      style={{
        '--rd-accent': accent,
        '--rd-scale': SIZE_SCALE[style.size] ?? 1,
        '--rd-mul': SPACING_MUL[style.spacing] ?? 1,
      }}
    >
      {children}
    </div>
  )

  if (layout === 'sidebar') {
    return root(
      <div className="rd-grid">
        <div className="rd-side">
          {contact}
          {order.filter(inSidebar).map(render)}
        </div>
        <div className="rd-main">
          {header}
          {order.filter((k) => !inSidebar(k)).map(render)}
        </div>
      </div>,
    )
  }
  return root(
    <>
      {header}
      {order.map(render)}
    </>,
  )
}

// Many previews can be on screen at once (the template gallery shows fourteen),
// and the editor re-renders on every keystroke. A preview whose data, template
// and colour haven't changed has nothing to redraw.
export default memo(ResumeDocument)
