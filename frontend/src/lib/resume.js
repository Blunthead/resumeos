// accent: the template's signature colour (new resumes start with it).
// layout: 'single' reads most reliably in job-portal parsers; 'sidebar' puts
// contact, skills and education in a side panel and suits sending directly.
export const TEMPLATES = [
  { id: 'modern', accent: '#3d5a80', name: 'Modern', layout: 'single', blurb: 'Clean sans-serif with a splash of colour.' },
  { id: 'classic', accent: '#1f2937', name: 'Classic', layout: 'single', blurb: 'Traditional serif, centred header.' },
  { id: 'minimal', accent: '#52606d', name: 'Minimal', layout: 'single', blurb: 'Light and airy, lots of whitespace.' },
  { id: 'bold', accent: '#6d4553', name: 'Bold', layout: 'single', blurb: 'A confident colour header.' },
  { id: 'compact', accent: '#3f6b66', name: 'Compact', layout: 'single', blurb: 'Fits more on one page.' },
  { id: 'elegant', accent: '#8a6d3b', name: 'Elegant', layout: 'single', blurb: 'Refined serif headings with fine rules.' },
  { id: 'executive', accent: '#3f5b45', name: 'Executive', layout: 'single', blurb: 'Authoritative, for senior roles.' },
  { id: 'timeline', accent: '#5b5a7e', name: 'Timeline', layout: 'single', blurb: 'A clear line through your career.' },
  { id: 'split', accent: '#8a5a3c', name: 'Split', layout: 'single', blurb: 'Name on the left, details on the right.' },
  { id: 'tech', accent: '#5c6b3a', name: 'Tech', layout: 'single', blurb: 'A developer-friendly monospace touch.' },
  { id: 'academic', accent: '#6b3a3a', name: 'Academic', layout: 'single', blurb: 'Formal and text-first, CV style.' },
  { id: 'sidebar', accent: '#34495e', name: 'Sidebar', layout: 'sidebar', blurb: 'Bold colour panel on the side.' },
  { id: 'sidebar-soft', accent: '#4a6572', name: 'Sidebar Soft', layout: 'sidebar', blurb: 'A gentle tinted side panel.' },
  { id: 'sidebar-dark', accent: '#b8975a', name: 'Sidebar Dark', layout: 'sidebar', blurb: 'Deep navy panel, sharp contrast.' },
]

export const layoutOf = (templateId) => TEMPLATES.find((t) => t.id === templateId)?.layout ?? 'single'

// Muted, professional tones only: every template's signature colour, so each
// one is always reachable from the picker.
export const ACCENTS = ['#3d5a80', '#1f2937', '#52606d', '#6d4553', '#3f6b66', '#8a6d3b', '#3f5b45', '#5b5a7e', '#8a5a3c', '#5c6b3a', '#6b3a3a', '#34495e', '#4a6572', '#b8975a']

export const accentOf = (templateId) => TEMPLATES.find((t) => t.id === templateId)?.accent ?? '#3d5a80'

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const blankExperience = () => ({
  id: newId(), role: '', company: '', location: '', startDate: '', endDate: '', description: '',
})
export const blankEducation = () => ({
  id: newId(), degree: '', school: '', location: '', startDate: '', endDate: '', details: '',
})
export const blankProject = () => ({ id: newId(), name: '', link: '', description: '' })

// One bullet per line; tolerate people pasting their own "-" or "•".
export function toBullets(text) {
  return (text || '')
    .split('\n')
    .map((line) => line.replace(/^\s*[-•*–]\s*/, '').trim())
    .filter(Boolean)
}

export function isEmptyResume(data) {
  const c = data.contact
  return (
    !Object.values(c).some((v) => v.trim()) &&
    !data.summary.trim() &&
    !data.experience.length &&
    !data.education.length &&
    !data.projects.length &&
    !data.skills.length &&
    !data.certifications.length
  )
}

export const SAMPLE = {
  contact: {
    fullName: 'Alex Morgan',
    jobTitle: 'Software Engineer',
    email: 'alex.morgan@example.com',
    phone: '+1 555 010 2030',
    location: 'Austin, TX',
    website: 'alexmorgan.dev',
    linkedin: 'linkedin.com/in/alexmorgan',
  },
  summary:
    'Software engineer with 5 years of experience building reliable, fast web products used by hundreds of thousands of people. Comfortable across the whole stack, and happiest turning a messy problem into something simple that people enjoy using.',
  experience: [
    {
      id: 's1',
      role: 'Senior Software Engineer',
      company: 'Brightline',
      location: 'Austin, TX',
      startDate: 'Jun 2022',
      endDate: 'Present',
      description:
        'Rebuilt the onboarding flow, lifting completion from 52% to 74% across 120,000 new users\nCut average API response time by 38% by adding caching and database indexes\nLed a team of four to ship a billing platform that now processes $2M a month\nMentored two junior engineers and ran weekly code reviews',
    },
    {
      id: 's2',
      role: 'Software Engineer',
      company: 'Northwind Labs',
      location: 'Remote',
      startDate: 'Jul 2020',
      endDate: 'May 2022',
      description:
        'Shipped 20+ customer-facing features in React and Node.js\nWrote the automated test suite that caught regressions before every release\nMigrated a legacy monolith to services, reducing deploy time from 40 to 8 minutes\nPartnered with design to cut support tickets by 25%',
    },
    {
      id: 's3',
      role: 'Software Engineering Intern',
      company: 'Cedar Systems',
      location: 'Austin, TX',
      startDate: 'May 2019',
      endDate: 'Aug 2019',
      description:
        'Built an internal dashboard used daily by 60 support agents\nAutomated a weekly report that saved the team 5 hours every week',
    },
  ],
  projects: [
    {
      id: 's4',
      name: 'Trailmap',
      link: 'github.com/alexmorgan/trailmap',
      description:
        'Open-source hiking route planner with 1,200+ GitHub stars\nBuilt with React, Node.js and PostGIS; used by 8,000 hikers a month',
    },
  ],
  education: [
    {
      id: 's6',
      degree: 'B.S. Computer Science',
      school: 'University of Texas at Austin',
      location: 'Austin, TX',
      startDate: '2016',
      endDate: '2020',
      details: 'GPA 3.8 · Dean’s List · Teaching assistant for Data Structures',
    },
  ],
  skills: [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'PostgreSQL',
    'MongoDB',
    'AWS',
    'Docker',
    'REST APIs',
    'Testing',
    'CI/CD',
  ],
  certifications: ['AWS Certified Developer – Associate', 'Certified Scrum Master'],
}

export const BLANK_DATA = {
  contact: { fullName: '', jobTitle: '', email: '', phone: '', location: '', website: '', linkedin: '' },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
}
