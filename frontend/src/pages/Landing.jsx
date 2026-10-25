import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import PaperPreview from '../components/PaperPreview.jsx'
import ResumeDocument from '../components/ResumeDocument.jsx'
import { SAMPLE } from '../lib/resume.js'

const STEPS = [
  { n: '1', title: 'Pick a template', text: 'Fourteen clean layouts, from classic single-column to a bold sidebar.' },
  { n: '2', title: 'Fill in the blanks', text: 'A short guided form, and your resume updates live as you type.' },
  { n: '3', title: 'Download your PDF', text: 'Ready to send. Switch template or colour any time.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="grid items-center gap-12 py-12 md:grid-cols-2 md:py-20">
          <div className="rise">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
              A resume you can be proud of, in minutes.
            </h1>
            <p className="mt-5 max-w-md text-lg text-slate-600">
              Choose a template, answer a few simple questions, and download a clean PDF. No sign-up needed to start.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/templates"
                className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Create my resume
              </Link>
              <Link to="/resumes" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Open my resumes
              </Link>
            </div>
          </div>

          <div className="rise mx-auto w-full max-w-sm" style={{ animationDelay: '0.08s' }}>
            <div className="overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
              <PaperPreview clip>
                <ResumeDocument data={SAMPLE} template="modern" accent="#3d5a80" />
              </PaperPreview>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                {s.n}
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h2>
              <p className="mt-1.5 text-slate-600">{s.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
