'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Briefcase, Brain, BarChart3, Users, Sparkles, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const features = [
  { icon: Brain, title: 'AI Resume Analysis', desc: 'Auto-extract skills, experience, and education from resumes with AI' },
  { icon: Briefcase, title: 'Smart Job Matching', desc: 'Match candidates to jobs with 0-100 scoring across skills and experience' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track hiring metrics, skill trends, and candidate quality scores' },
  { icon: Users, title: 'Candidate Shortlisting', desc: 'Auto-shortlist with 80+ strong, 60-79 medium, below 60 reject' },
  { icon: Sparkles, title: 'AI Interview Questions', desc: 'Generate role-specific technical and HR interview questions' },
  { icon: Shield, title: 'Skill Gap Analysis', desc: 'Identify missing skills and get improvement suggestions' },
]

export default function Landing() {
  const { user, isHR } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push(isHR ? '/hr/dashboard' : '/employee/dashboard')
  }, [user, isHR, router])

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-slate-900 text-lg">HireFlow AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2">Sign In</Link>
            <Link href="/register" className="text-sm font-medium bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 mb-6">
            <Sparkles className="w-4 h-4" /> AI-Powered Hiring Platform
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Hire Smarter with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">AI-Driven</span>{' '}
            Candidate Matching
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10">
            Upload resumes, create jobs, and let AI analyze, score, and shortlist candidates automatically.
            Built for modern HR teams.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 bg-white text-slate-700 px-8 py-3 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-all">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to hire</h2>
          <p className="text-slate-500 max-w-xl mx-auto">From job posting to candidate shortlisting, AI handles the heavy lifting.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} HireFlow AI. All rights reserved.
      </footer>
    </div>
  )
}
