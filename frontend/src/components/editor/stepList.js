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
const NATIVE = {
  summary: { hint: 'A short introduction.', Component: SummaryStep },
  experience: { hint: 'Start with your most recent job.', Component: ExperienceStep },
  projects: { hint: 'Great if you are early in your career.', Component: ProjectsStep },
  education: { hint: 'Where did you study?', Component: EducationStep },
  skills: { hint: 'What are you good at?', Component: SkillsStep },
  certifications: { hint: 'Anything you are certified in.', Component: CertificationsStep },
  languages: { hint: 'Which languages do you speak?', Component: LanguagesStep },
}

// Contact first, then every section in the order it appears on the resume, so
// the tabs, the form and the preview always agree.
export function buildSteps(data) {
  const steps = [{ key: 'contact', title: 'Contact', hint: 'How can employers reach you?', Component: ContactStep }]
  for (const key of resolveOrder(data)) {
    if (isCustomKey(key)) {
      const id = customIdOf(key)
      const section = data.custom.find((c) => c.id === id)
      steps.push({
        key,
        title: section?.title?.trim() || 'Untitled section',
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
