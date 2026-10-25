import SiteHeader from '../components/SiteHeader.jsx'
import Hero from '../components/landing/Hero.jsx'
import Showcase from '../components/landing/Showcase.jsx'
import Features from '../components/landing/Features.jsx'
import HowItWorks from '../components/landing/HowItWorks.jsx'
import FinalCta from '../components/landing/FinalCta.jsx'
import Footer from '../components/landing/Footer.jsx'

export default function Landing() {
  return (
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
  )
}
