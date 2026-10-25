import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Landing from './pages/Landing.jsx'
import { loadDashboard, loadEditor, loadTemplates } from './lib/routes.js'

// The landing page is bundled with the app because nearly every first visit
// lands on it. Everything else loads on demand.
const Templates = lazy(loadTemplates)
const Dashboard = lazy(loadDashboard)
const Editor = lazy(loadEditor)

function PageLoading() {
  return (
    <div role="status" className="grid min-h-screen place-items-center text-slate-500">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/resumes" element={<Dashboard />} />
          <Route path="/resumes/:id" element={<Editor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
