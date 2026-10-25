// Each page below the landing page is its own chunk, so the first visit only
// downloads what the landing page needs. These loaders are shared so the app
// can also fetch a page's code ahead of time, while the visitor is still on
// the page before it.
export const loadTemplates = () => import('../pages/Templates.jsx')
export const loadDashboard = () => import('../pages/Dashboard.jsx')
export const loadEditor = () => import('../pages/Editor.jsx')

// Runs `fn` when the browser is idle, so prefetching never competes with
// whatever the visitor is actually doing.
export function whenIdle(fn) {
  if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 3000 })
  else setTimeout(fn, 1500)
}
