'use client'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Lightbulb, MessageSquare } from 'lucide-react'
import Badge from '@/components/ui/Badge'

interface Props {
  strengths?: string[]
  skillGaps?: string[]
  feedback?: string
  improvements?: string[]
  loading?: boolean
}

export default function AnalysisPanel({ strengths, skillGaps, feedback, improvements, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-6 bg-slate-200 rounded-full w-16" />
          <div className="h-6 bg-slate-200 rounded-full w-20" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5"
    >
      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-500" />
        AI Analysis
      </h3>

      {feedback && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-blue-800">{feedback}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strengths && strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-emerald-700 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4" /> Strengths
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {strengths.map((s, i) => (
                <Badge key={i} variant="success">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {skillGaps && skillGaps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-600 flex items-center gap-1.5 mb-2">
              <XCircle className="w-4 h-4" /> Skill Gaps
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skillGaps.map((s, i) => (
                <Badge key={i} variant="danger">{s}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {improvements && improvements.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <h4 className="text-sm font-medium text-amber-800 flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-4 h-4" /> Suggestions
          </h4>
          <ul className="space-y-1">
            {improvements.map((imp, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-0.5">•</span> {imp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
