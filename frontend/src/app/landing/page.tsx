'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Phone,
  Users,
  Upload,
  Search,
  History,
  Bot,
  Globe,
  Zap,
  Shield,
  ChevronRight,
  Play,
  Star,
  CheckCircle,
  ArrowRight,
  Mic,
  FileText,
  MapPin,
  TrendingUp,
  Clock,
  BarChart3,
  Languages,
  PhoneCall,
  Sparkles,
  Download,
} from 'lucide-react'

// ─── Typewriter Hook ────────────────────────────────────────────
function useTypewriter(texts: string[], speed = 60, pause = 1800) {
  const [display, setDisplay] = useState('')
  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[textIdx]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting) {
      if (charIdx < current.length) {
        timeout = setTimeout(() => setCharIdx((c) => c + 1), speed)
      } else {
        timeout = setTimeout(() => setDeleting(true), pause)
      }
    } else {
      if (charIdx > 0) {
        timeout = setTimeout(() => setCharIdx((c) => c - 1), speed / 2)
      } else {
        setDeleting(false)
        setTextIdx((i) => (i + 1) % texts.length)
      }
    }

    setDisplay(current.slice(0, charIdx))
    return () => clearTimeout(timeout)
  }, [charIdx, deleting, textIdx, texts, speed, pause])

  return display
}

// ─── Animated Counter ────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const animated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true
          const duration = 2000
          const steps = 60
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Floating Orb Background ─────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute rounded-full opacity-20 dark:opacity-10 blur-3xl animate-pulse"
        style={{
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, #6366f1, transparent)',
          top: '-100px',
          left: '-100px',
          animationDuration: '8s',
        }}
      />
      <div
        className="absolute rounded-full opacity-15 dark:opacity-10 blur-3xl animate-pulse"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, #8b5cf6, transparent)',
          bottom: '-50px',
          right: '-100px',
          animationDuration: '12s',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute rounded-full opacity-10 dark:opacity-8 blur-3xl animate-pulse"
        style={{
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, #06b6d4, transparent)',
          top: '40%',
          left: '50%',
          animationDuration: '10s',
          animationDelay: '4s',
        }}
      />
    </div>
  )
}

// ─── Live Call Demo Widget ────────────────────────────────────────
const demoSteps = [
  { label: 'Connecting to lead...', icon: PhoneCall, color: 'text-blue-500', delay: 0 },
  { label: 'AI agent introduced', icon: Bot, color: 'text-purple-500', delay: 1500 },
  { label: 'Prospect engaged', icon: Users, color: 'text-green-500', delay: 3000 },
  { label: 'Appointment booked!', icon: CheckCircle, color: 'text-emerald-500', delay: 5000 },
]

function LiveCallDemo() {
  const [activeStep, setActiveStep] = useState(-1)
  const [running, setRunning] = useState(false)
  const [transcript, setTranscript] = useState<string[]>([])

  const transcriptLines = [
    { speaker: 'AI', text: "Hi, this is Alex calling from TechSolutions. Is this a good time?" },
    { speaker: 'Lead', text: "Sure, what's this about?" },
    { speaker: 'AI', text: "I'd love to show you how we can increase your sales by 40% with AI calling. Can I schedule 15 minutes?" },
    { speaker: 'Lead', text: "That sounds interesting, yes!" },
  ]

  const startDemo = () => {
    if (running) return
    setRunning(true)
    setActiveStep(-1)
    setTranscript([])

    demoSteps.forEach((step, i) => {
      setTimeout(() => {
        setActiveStep(i)
        if (i < transcriptLines.length) {
          setTranscript((prev) => [...prev, transcriptLines[i].speaker + ': ' + transcriptLines[i].text])
        }
        if (i === demoSteps.length - 1) {
          setTimeout(() => setRunning(false), 2000)
        }
      }, step.delay)
    })
  }

  return (
    <div className="glass-card p-6 rounded-2xl space-y-4 max-w-md w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm font-semibold">{running ? 'Live Call' : 'Demo Ready'}</span>
        </div>
        <button
          onClick={startDemo}
          disabled={running}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <Play className="h-3.5 w-3.5" />
          {running ? 'Running...' : 'Start Demo'}
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {demoSteps.map((step, i) => {
          const Icon = step.icon
          const isActive = activeStep >= i
          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-500 ${
                isActive ? 'bg-white/10 dark:bg-white/5' : 'opacity-40'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? step.color : 'text-gray-400'}`} />
              <span className={`text-sm ${isActive ? 'text-foreground' : 'text-gray-400'}`}>
                {step.label}
              </span>
              {isActive && i === activeStep && running && (
                <div className="ml-auto flex gap-1">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: `${j * 150}ms` }}
                    />
                  ))}
                </div>
              )}
              {isActive && (activeStep > i || !running) && (
                <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
              )}
            </div>
          )
        })}
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="border-t border-white/10 pt-3 space-y-1.5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Transcript</p>
          {transcript.map((line, i) => (
            <p key={i} className="text-xs text-secondary animate-fade-in">
              <span className={`font-semibold ${line.startsWith('AI:') ? 'text-indigo-500' : 'text-emerald-500'}`}>
                {line.split(':')[0]}:
              </span>
              {line.slice(line.indexOf(':') + 1)}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Feature Tabs ─────────────────────────────────────────────────
const featureTabs = [
  {
    id: 'search',
    icon: Search,
    label: 'Smart Search',
    title: 'Find Leads with Google Maps',
    description:
      'Type "Dentists in New York" and instantly get a list of businesses with phone numbers, addresses, and ratings. One click to add them as leads.',
    bullets: [
      'Real-time Google Places API integration',
      'Automatic phone & rating extraction',
      'Duplicate detection — never add the same lead twice',
      'One-click add to your lead pipeline',
    ],
    preview: (
      <div className="glass-card p-4 rounded-xl space-y-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <Search className="h-4 w-4 text-indigo-500" />
          <span className="text-sm">Dentists in New York</span>
        </div>
        {['Smile Dental NYC ⭐ 4.8', 'Manhattan Smiles ⭐ 4.6', 'Park Avenue Dental ⭐ 4.9'].map((name, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
            <div>
              <p className="text-sm font-medium">{name.split(' ⭐')[0]}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> New York, NY
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-yellow-400">{name.split('⭐ ')[1]}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">Add</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'import',
    icon: Upload,
    label: 'File Import',
    title: 'Import from Any File Format',
    description:
      'Drop a PDF, Excel, Word, or CSV file and our AI parser extracts all contact information automatically. Smart deduplication prevents duplicate leads.',
    bullets: [
      'PDF, Excel (.xlsx/.xls), Word (.docx), CSV support',
      'AI-powered contact extraction',
      'Automatic phone deduplication',
      'Detailed import summary with success/skip/fail counts',
    ],
    preview: (
      <div className="glass-card p-4 rounded-xl space-y-3">
        <div className="border-2 border-dashed border-indigo-500/30 rounded-xl p-6 text-center space-y-2">
          <Upload className="h-8 w-8 text-indigo-500 mx-auto" />
          <p className="text-sm font-medium">Drop your file here</p>
          <p className="text-xs text-gray-400">PDF, Excel, Word, CSV supported</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ label: 'Imported', value: '247', color: 'text-green-400' }, { label: 'Skipped', value: '18', color: 'text-yellow-400' }, { label: 'Failed', value: '2', color: 'text-red-400' }].map((s) => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-white/5">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'ai-call',
    icon: Bot,
    label: 'AI Calling',
    title: 'AI Voice Agents for Cold Calls',
    description:
      'Deploy intelligent AI agents to make cold calls on your behalf. Define the purpose, and the AI handles the conversation naturally in 12+ languages.',
    bullets: [
      'Powered by Vapi.ai with Google Gemini',
      '12 languages: English, Hindi, Tamil, Telugu + more',
      'Fallback providers ensure 99.9% uptime',
      'Custom greetings and call purposes per language',
    ],
    preview: (
      <div className="glass-card p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Mic className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Agent Active</p>
            <p className="text-xs text-green-400">Call in progress • 0:47</p>
          </div>
          <div className="ml-auto flex gap-1">
            {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
              <div key={i} className="w-1 bg-green-500 rounded-full animate-pulse" style={{ height: h * 4, animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {[
            { who: 'AI', msg: "Hi! I'm Alex from TechSolutions. Quick question..." },
            { who: 'Lead', msg: "Sure, what is it about?" },
          ].map((m, i) => (
            <div key={i} className={`text-xs p-2 rounded-lg ${m.who === 'AI' ? 'bg-indigo-500/10 text-indigo-300' : 'bg-white/5 text-gray-300'}`}>
              <span className="font-semibold">{m.who}: </span>{m.msg}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'history',
    icon: History,
    label: 'Call History',
    title: 'Complete Call Logs & Transcripts',
    description:
      'Every call is recorded and transcribed. Review full conversations, listen to recordings, and track outcomes to improve your pitch over time.',
    bullets: [
      'Full conversation transcripts',
      'Audio recording playback',
      'Call outcome tracking (completed, failed, voicemail)',
      'Duration and timestamp for every call',
    ],
    preview: (
      <div className="glass-card p-4 rounded-xl space-y-2">
        {[
          { name: 'Smile Dental NYC', duration: '3:24', status: 'completed', outcome: 'Appointment' },
          { name: 'Manhattan Smiles', duration: '1:12', status: 'completed', outcome: 'Follow-up' },
          { name: 'Park Avenue Dental', duration: '0:45', status: 'voicemail', outcome: 'Left message' },
        ].map((call, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
            <div className={`w-2 h-2 rounded-full ${call.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{call.name}</p>
              <p className="text-xs text-gray-400">{call.outcome}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-mono text-gray-300">{call.duration}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Play className="h-2.5 w-2.5 text-indigo-400" />
                <FileText className="h-2.5 w-2.5 text-purple-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
]

// ─── Language Badge ───────────────────────────────────────────────
const languages = [
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'HI', name: 'Hindi', flag: '🇮🇳' },
  { code: 'TA', name: 'Tamil', flag: '🇮🇳' },
  { code: 'TE', name: 'Telugu', flag: '🇮🇳' },
  { code: 'KN', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ML', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'BN', name: 'Bengali', flag: '🇮🇳' },
  { code: 'MR', name: 'Marathi', flag: '🇮🇳' },
  { code: 'GU', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'FR', name: 'French', flag: '🇫🇷' },
  { code: 'AR', name: 'Arabic', flag: '🇸🇦' },
]

// ─── Scroll Reveal ────────────────────────────────────────────────
function RevealSection({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'scale'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          el.style.transitionDelay = delay ? `${delay}ms` : ''
          el.classList.add('sr-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  const dirClass = direction === 'left' ? 'sr sr-left' : direction === 'right' ? 'sr sr-right' : direction === 'scale' ? 'sr sr-scale' : 'sr'
  return (
    <div ref={ref} className={`${dirClass} ${className}`}>
      {children}
    </div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────
export default function LandingPage() {
  const heroText = useTypewriter([
    'Cold Calls at Scale',
    'Lead Management',
    'AI Voice Agents',
    'Multilingual Support',
  ])

  const [activeFeature, setActiveFeature] = useState(0)
  const [hoveredLang, setHoveredLang] = useState<string | null>(null)

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
        <FloatingOrbs />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Powered by Vapi.ai + Google Gemini
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="gradient-text">AI-Powered</span>
            <br />
            <span className="text-foreground">{heroText}</span>
            <span className="animate-pulse text-indigo-400">|</span>
          </h1>

          <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
            Find leads from Google Maps, import from files, and let AI voice agents
            make personalized cold calls in <strong>12 languages</strong> — while you focus on closing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            >
              Open Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl glass-card hover:bg-white/10 font-semibold text-lg transition-all duration-200 cursor-pointer"
            >
              <Play className="h-5 w-5 text-indigo-400" />
              See Features
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 text-sm text-secondary pt-4">
            {[
              { icon: Shield, text: 'No credit card required' },
              { icon: Zap, text: 'Setup in 2 minutes' },
              { icon: Globe, text: '12 languages supported' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-indigo-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-secondary animate-bounce">
          <span className="text-xs">Scroll to explore</span>
          <div className="w-5 h-8 rounded-full border-2 border-current flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-current animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Stats Section ─────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-blue-600/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: 12, suffix: '+', label: 'Languages', icon: Languages },
            { value: 10000, suffix: '+', label: 'Calls Supported', icon: Phone },
            { value: 99, suffix: '%', label: 'Uptime', icon: TrendingUp },
            { value: 5, suffix: 'x', label: 'Faster Outreach', icon: Zap },
          ].map(({ value, suffix, label, icon: Icon }, i) => (
            <RevealSection key={label} delay={i * 100} direction="scale">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 mb-2">
                  <Icon className="h-6 w-6 text-indigo-400" />
                </div>
                <p className="text-4xl font-bold gradient-text">
                  <AnimatedCounter target={value} suffix={suffix} />
                </p>
                <p className="text-secondary font-medium">{label}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── Live Demo Section ─────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-12 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20">
              Interactive Demo
            </span>
            <h2 className="text-4xl font-bold">See It In Action</h2>
            <p className="text-secondary max-w-xl mx-auto">
              Click "Start Demo" to simulate an AI cold call flow in real-time
            </p>
          </RevealSection>

          <div className="flex flex-col lg:flex-row items-center gap-12">
            <RevealSection direction="left" className="flex-1 space-y-6">
              <div className="space-y-4">
                {[
                  {
                    step: '01',
                    title: 'Select a Lead',
                    desc: 'Choose from your lead list or add one from Google Maps',
                  },
                  {
                    step: '02',
                    title: 'Configure the AI Agent',
                    desc: 'Set the call purpose, language, and greeting style',
                  },
                  {
                    step: '03',
                    title: 'AI Handles the Call',
                    desc: 'Real-time conversation with natural voice responses',
                  },
                  {
                    step: '04',
                    title: 'Review the Results',
                    desc: 'Full transcript and recording available immediately',
                  },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-400">{step}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-sm text-secondary">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>

            <RevealSection direction="right" delay={150} className="flex-shrink-0 w-full lg:w-auto">
              <LiveCallDemo />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── Feature Tabs Section ──────────────────────────────── */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-transparent to-indigo-500/5">
        <div className="max-w-6xl mx-auto">
          <RevealSection className="text-center mb-12 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20">
              Features
            </span>
            <h2 className="text-4xl font-bold">Everything You Need to Scale Outreach</h2>
            <p className="text-secondary max-w-xl mx-auto">
              From finding leads to booking appointments — one platform handles it all
            </p>
          </RevealSection>

          {/* Tab navigation */}
          <RevealSection delay={100} className="flex flex-wrap justify-center gap-2 mb-8">
            {featureTabs.map((tab, i) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeature(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    activeFeature === i
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'glass-card hover:bg-white/10 text-secondary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </RevealSection>

          {/* Tab content */}
          {featureTabs.map((tab, i) => (
            <div
              key={tab.id}
              className={`transition-all duration-300 ${activeFeature === i ? 'block animate-fade-in' : 'hidden'}`}
            >
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold">{tab.title}</h3>
                  <p className="text-secondary text-lg leading-relaxed">{tab.description}</p>
                  <ul className="space-y-3">
                    {tab.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Try it now <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex justify-center lg:justify-end">
                  {tab.preview}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Language Support Section ───────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-12 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium border border-purple-500/20">
              Multilingual
            </span>
            <h2 className="text-4xl font-bold">Reach Everyone, In Their Language</h2>
            <p className="text-secondary max-w-xl mx-auto">
              Native voice synthesis and transcription for 12 languages with automatic fallback providers
            </p>
          </RevealSection>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {languages.map((lang, i) => (
              <RevealSection key={lang.code} delay={i * 60} direction="scale">
                <div
                  onMouseEnter={() => setHoveredLang(lang.code)}
                  onMouseLeave={() => setHoveredLang(null)}
                  className="glass-card p-4 rounded-xl text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:border-indigo-500/30"
                >
                  <div className="text-2xl mb-1">{lang.flag}</div>
                  <p className="text-xs font-bold text-indigo-400">{lang.code}</p>
                  <p
                    className={`text-xs transition-all duration-200 ${
                      hoveredLang === lang.code ? 'text-foreground opacity-100' : 'text-secondary opacity-70'
                    }`}
                  >
                    {lang.name}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection delay={200} className="mt-8 glass-card p-5 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold">Automatic Fallback Providers</p>
                <p className="text-sm text-secondary">
                  If the primary voice provider fails, the system automatically switches to a backup (Azure, Talkscriber) — ensuring your calls always go through.
                </p>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-b from-indigo-500/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-12 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">
              How It Works
            </span>
            <h2 className="text-4xl font-bold">From Lead to Conversation in Minutes</h2>
          </RevealSection>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-blue-500/20 hidden lg:block" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {[
                {
                  step: 1,
                  icon: Search,
                  title: 'Find Leads',
                  desc: 'Search Google Maps or import from files',
                  color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                },
                {
                  step: 2,
                  icon: Users,
                  title: 'Manage Pipeline',
                  desc: 'Organize leads with status tracking',
                  color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                },
                {
                  step: 3,
                  icon: Bot,
                  title: 'Deploy AI Agent',
                  desc: 'Configure your AI calling agent',
                  color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                },
                {
                  step: 4,
                  icon: BarChart3,
                  title: 'Analyze Results',
                  desc: 'Review transcripts and recordings',
                  color: 'bg-green-500/10 text-green-400 border-green-500/20',
                },
              ].map(({ step, icon: Icon, title, desc, color }, i) => (
                <RevealSection key={step} delay={i * 120} direction="scale">
                  <div className="relative flex flex-col items-center text-center space-y-3">
                    <div className={`relative z-10 w-16 h-16 rounded-2xl border flex items-center justify-center ${color}`}>
                      <Icon className="h-7 w-7" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        {step}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <p className="text-sm text-secondary">{desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Additional Features Grid ──────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-12 space-y-3">
            <h2 className="text-4xl font-bold">Built for Professionals</h2>
            <p className="text-secondary">Every detail designed to save you time and maximize conversions</p>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Download,
                title: 'Export CSV',
                desc: 'Export your entire lead database with one click',
                color: 'text-blue-400 bg-blue-500/10',
              },
              {
                icon: Clock,
                title: 'Real-Time Status',
                desc: 'Live updates during calls — Connecting → In Progress → Completed',
                color: 'text-green-400 bg-green-500/10',
              },
              {
                icon: Shield,
                title: 'Deduplication',
                desc: 'Never import or add the same phone number twice',
                color: 'text-purple-400 bg-purple-500/10',
              },
              {
                icon: FileText,
                title: 'Auto Transcripts',
                desc: 'Every conversation transcribed and saved automatically',
                color: 'text-orange-400 bg-orange-500/10',
              },
              {
                icon: Mic,
                title: 'Call Recordings',
                desc: 'Audio recordings stored and playable anytime',
                color: 'text-red-400 bg-red-500/10',
              },
              {
                icon: BarChart3,
                title: 'Grid & List Views',
                desc: 'Switch between card grid and compact list view for leads',
                color: 'text-cyan-400 bg-cyan-500/10',
              },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <RevealSection key={title} delay={i * 80}>
                <div className="glass-card-hover p-5 rounded-xl space-y-3 h-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-secondary">{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial-style quotes ──────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-blue-600/5">
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-12">
            <h2 className="text-4xl font-bold">Why AI Calling?</h2>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Traditional cold calling takes hours. AI agents can run 24/7, making hundreds of calls while your team sleeps.',
                author: 'Scale Without Limits',
                icon: Zap,
                color: 'text-yellow-400',
              },
              {
                quote: 'Every conversation is automatically transcribed. Learn what works, refine your pitch, and improve conversion rates.',
                author: 'Data-Driven Insights',
                icon: BarChart3,
                color: 'text-blue-400',
              },
              {
                quote: 'Reach customers in their native language — Tamil, Hindi, Spanish, Arabic. Build trust through natural conversation.',
                author: 'Language is Connection',
                icon: Globe,
                color: 'text-green-400',
              },
            ].map(({ quote, author, icon: Icon, color }, i) => (
              <RevealSection key={author} delay={i * 120} direction="scale">
                <div className="glass-card p-6 rounded-2xl space-y-4 h-full">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-secondary italic leading-relaxed">"{quote}"</p>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <span className="font-semibold text-sm">{author}</span>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <RevealSection direction="scale" className="max-w-3xl mx-auto text-center space-y-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl bg-indigo-500/20 rounded-full" />
            <h2 className="relative text-5xl font-bold leading-tight">
              Ready to Automate
              <br />
              <span className="gradient-text">Your Cold Calls?</span>
            </h2>
          </div>
          <p className="text-xl text-secondary">
            Join the future of sales outreach. Set up in minutes, scale in hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-10 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg transition-all duration-200 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1"
            >
              <PhoneCall className="h-5 w-5" />
              Start Calling Now
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-10 py-4 rounded-xl glass-card hover:bg-white/10 font-semibold text-lg transition-all duration-200 cursor-pointer"
            >
              Learn More
              <ChevronRight className="h-5 w-5" />
            </a>
          </div>
          <p className="text-sm text-secondary">No credit card required • Free to get started</p>
        </RevealSection>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-indigo-400" />
            <span className="font-bold gradient-text">AI Caller</span>
          </div>
          <p className="text-sm text-secondary text-center">
            Built with Next.js, FastAPI, Vapi.ai & Supabase
          </p>
          <div className="flex items-center gap-4 text-sm text-secondary">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/agents" className="hover:text-foreground transition-colors">Agents</Link>
            <Link href="/leads" className="hover:text-foreground transition-colors">Leads</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
