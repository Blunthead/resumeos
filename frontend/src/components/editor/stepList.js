import {
  CertificationsStep,
  ContactStep,
  EducationStep,
  ExperienceStep,
  ProjectsStep,
  SkillsStep,
  SummaryStep,
} from './steps.jsx'

// The editor's steps, in order. Kept apart from the step components so that
// file can export components only, which is what fast refresh requires.
export const STEPS = [
  { id: 'contact', title: 'Contact', hint: 'How can employers reach you?', Component: ContactStep },
  { id: 'summary', title: 'Summary', hint: 'A short introduction.', Component: SummaryStep },
  { id: 'experience', title: 'Experience', hint: 'Start with your most recent job.', Component: ExperienceStep },
  { id: 'projects', title: 'Projects', hint: 'Great if you are early in your career.', Component: ProjectsStep },
  { id: 'education', title: 'Education', hint: 'Where did you study?', Component: EducationStep },
  { id: 'skills', title: 'Skills', hint: 'What are you good at?', Component: SkillsStep },
  { id: 'certifications', title: 'Certifications', hint: 'Anything you are certified in.', Component: CertificationsStep },
]
