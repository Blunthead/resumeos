import { Component } from 'react'

// Without this, one unexpected error while rendering blanks the whole page.
// Edits are autosaved, so reloading is always a safe way out.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('[app] render failed', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">Something went wrong</p>
          <p className="mt-1 text-slate-600">Your work is saved. Reloading usually fixes it.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
