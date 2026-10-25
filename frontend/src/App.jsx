import { Navigate, Route, Routes } from 'react-router-dom'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import Landing from './pages/Landing.jsx'
import Templates from './pages/Templates.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Editor from './pages/Editor.jsx'

// LazyMotion loads only the animation features the app uses. reducedMotion
// "user" turns movement off for anyone who has asked their OS for less of it.
export default function App() {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/resumes" element={<Dashboard />} />
          <Route path="/resumes/:id" element={<Editor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MotionConfig>
    </LazyMotion>
  )
}
