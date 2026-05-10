'use client'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  skillScore: number
  expScore: number
  overallScore: number
  verdict?: string
}

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="68" height="68" className="transform -rotate-90">
        <circle cx="34" cy="34" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="5" />
        <circle cx="34" cy="34" r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="text-base font-bold" style={{ color }}>{value}%</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

export default function MatchScoreCard({ skillScore, expScore, overallScore, verdict }: Props) {
  const color = overallScore >= 80 ? '#10B981' : overallScore >= 60 ? '#F59E0B' : '#EF4444'
  const Icon = overallScore >= 60 ? TrendingUp : TrendingDown

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">AI Match Score</h3>
        <span className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full
          ${overallScore >= 80 ? 'bg-emerald-50 text-emerald-700' :
            overallScore >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
          <Icon className="w-4 h-4" />
          {verdict || 'Analyzed'}
        </span>
      </div>

      <div className="flex justify-around items-center mb-4 -mx-1">
        <ScoreRing value={skillScore} label="Skills" color="#3B82F6" />
        <ScoreRing value={expScore} label="Experience" color="#8B5CF6" />
        <ScoreRing value={overallScore} label="Overall" color={color} />
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${overallScore}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full transition-all"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  )
}
