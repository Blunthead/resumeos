import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import { api } from '../lib/api.js'
import { TEMPLATES } from '../lib/resume.js'

const templateName = (id) => TEMPLATES.find((t) => t.id === id)?.name ?? id

function ago(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return new Date(iso).toLocaleDateString()
}

export default function Dashboard() {
  const [resumes, setResumes] = useState(null)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(null)

  useEffect(() => {
    api.listResumes().then(setResumes).catch((e) => setError(e.message))
  }, [])

  async function remove(id) {
    try {
      await api.deleteResume(id)
      setResumes((list) => list.filter((r) => r._id !== id))
    } catch (e) {
      setError(e.message)
    } finally {
      setConfirming(null)
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-24">
        <div className="flex items-center justify-between py-8">
          <h1 className="text-3xl font-bold tracking-tight">My resumes</h1>
          <Link to="/templates" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            New resume
          </Link>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {resumes === null && !error && <p className="text-slate-500">Loading…</p>}

        {resumes?.length === 0 && (
          <div className="rise rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200">
            <p className="text-lg font-semibold">No resumes yet</p>
            <p className="mt-1 text-slate-600">It only takes a few minutes. Let's make your first one.</p>
            <Link to="/templates" className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
              Create my resume
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {resumes?.map((r) => (
            <li key={r._id} className="rise flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: r.accent }} />
              <Link to={`/resumes/${r._id}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{r.title}</p>
                <p className="truncate text-sm text-slate-500">
                  {r.data?.contact?.fullName || 'No name yet'} · {templateName(r.template)} · edited {ago(r.updatedAt)}
                </p>
              </Link>
              {confirming === r._id ? (
                <span className="flex items-center gap-2 text-sm">
                  <button onClick={() => remove(r._id)} className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700">
                    Delete
                  </button>
                  <button onClick={() => setConfirming(null)} className="rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100">
                    Keep
                  </button>
                </span>
              ) : (
                <button onClick={() => setConfirming(r._id)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
