'use client'
import { motion } from 'framer-motion'

interface Props {
  applications: number
  analyzed: number
  shortlisted: number
  hired: number
}

export default function HiringFunnel({ applications, analyzed, shortlisted, hired }: Props) {
  const steps = [
    { label: 'Applications', value: applications, color: 'bg-blue-500' },
    { label: 'Analyzed', value: analyzed, color: 'bg-indigo-500' },
    { label: 'Shortlisted', value: shortlisted, color: 'bg-amber-500' },
    { label: 'Hired', value: hired, color: 'bg-emerald-500' },
  ]
  const maxVal = Math.max(...steps.map((s) => s.value), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
    >
      <h3 className="font-semibold text-slate-900 mb-6">Hiring Funnel</h3>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.label}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium text-slate-700">{step.label}</span>
              <span className="font-bold text-slate-900">{step.value}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(step.value / maxVal) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${step.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
