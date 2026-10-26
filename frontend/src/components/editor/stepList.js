import {
  CertificationsStep,
  ContactStep,
  CustomStep,
  EducationStep,
  ExperienceStep,
  LanguagesStep,
  ProjectsStep,
  SkillsStep,
  SummaryStep,
} from './steps.jsx'
import { SECTION_LABEL, customIdOf, isCustomKey, resolveOrder } from '../../lib/sections.js'

// The editor's steps. Kept apart from the step components so that file can
// export components only, which is what fast refresh requires.
// `title` is the short name on the tab; `heading` and `hint` talk to the person
// filling the form in.
const NATIVE = {
  summary: { heading: 'Say who you are in a few lines', hint: 'Two or three sentences is plenty. Bold and lists work here too.', Component: SummaryStep },
  experience: { heading: 'Where have you worked?', hint: 'Start with your most recent job.', Component: ExperienceStep },
  projects: { heading: 'What have you built?', hint: 'Projects are great evidence when you are early in your career.', Component: ProjectsStep },
  education: { heading: 'Where did you study?', hint: 'Add your degree, school and the years.', Component: EducationStep },
  skills: { heading: 'What are you good at?', hint: 'Type a skill and press Enter. Drag to reorder.', Component: SkillsStep },
  certifications: { heading: 'Any certifications?', hint: 'Courses and licences that back up your skills.', Component: CertificationsStep },
  languages: { heading: 'Which languages do you speak?', hint: 'Add the level if it helps, like "English (Fluent)".', Component: LanguagesStep },
}

// Contact first, then every section in the order it appears on the resume, so
// the tabs, the form and the preview always agree.
export function buildSteps(data) {
  const steps = [
    { key: 'contact', title: 'Contact', heading: "Let's start with your header", hint: 'Add your name and a few ways for employers to reach you.', Component: ContactStep },
  ]
  for (const key of resolveOrder(data)) {
    if (isCustomKey(key)) {
      const id = customIdOf(key)
      const section = data.custom.find((c) => c.id === id)
      steps.push({
        key,
        title: section?.title?.trim() || 'Untitled section',
        heading: section?.title?.trim() ? `Your ${section.title.trim()}` : 'Name your section',
        hint: 'A section of your own.',
        Component: CustomStep,
        sectionId: id,
      })
    } else {
      steps.push({ key, title: SECTION_LABEL[key], ...NATIVE[key] })
    }
  }
  return steps
}
