import { useEffect } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import SiteHeader from '../components/SiteHeader.jsx'
import Hero from '../components/landing/Hero.jsx'
import Showcase from '../components/landing/Showcase.jsx'
import Features from '../components/landing/Features.jsx'
import HowItWorks from '../components/landing/HowItWorks.jsx'
import FinalCta from '../components/landing/FinalCta.jsx'
import Footer from '../components/landing/Footer.jsx'
import { api } from '../lib/api.js'
import { loadTemplates, whenIdle } from '../lib/routes.js'

// The landing page is the only place that animates, so the animation library
// is provided here rather than app-wide. LazyMotion loads just the features
// used; reducedMotion "user" turns movement off for anyone who has asked
// their OS for less of it.
export default function Landing() {
  useEffect(() => {
    // Wake the API and fetch the next page while the visitor reads this one.
    api.warm()
    whenIdle(loadTemplates)
  }, [])

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-[#fbfbfd]">
          <SiteHeader cta />
          <main>
            <Hero />
            <Showcase />
            <Features />
            <HowItWorks />
            <FinalCta />
          </main>
          <Footer />
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
