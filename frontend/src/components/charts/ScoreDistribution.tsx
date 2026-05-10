'use client'
import { motion } from 'framer-motion'

interface Props {
  scores: number[]
}

export default function ScoreDistribution({ scores }: Props) {
  const ranges = [
    { label: '0-20', min: 0, max: 20, color: 'bg-red-500' },
    { label: '21-40', min: 21, max: 40, color: 'bg-orange-500' },
    { label: '41-60', min: 41, max: 60, color: 'bg-amber-500' },
    { label: '61-80', min: 61, max: 80, color: 'bg-blue-500' },
    { label: '81-100', min: 81, max: 100, color: 'bg-emerald-500' },
  ]

  const maxCount = Math.max(
    ...ranges.map((r) => scores.filter((s) => s >= r.min && s <= r.max).length),
    1,
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
    >
      <h3 className="font-semibold text-slate-900 mb-6">Score Distribution</h3>
      <div className="flex items-end justify-between gap-3 h-40">
        {ranges.map((r) => {
          const count = scores.filter((s) => s >= r.min && s <= r.max).length
          const height = (count / maxCount) * 100
          return (
            <div key={r.label} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-slate-900">{count}</span>
              <div className="w-full rounded-md overflow-hidden" style={{ height: '120px' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`w-full rounded-md ${r.color}`}
                  style={{ minHeight: count > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-xs text-slate-400">{r.label}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
