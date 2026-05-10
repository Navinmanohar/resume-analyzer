'use client'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  candidateSkills: string[]
  requiredSkills: string[]
  skillGaps: string[]
}

export default function SkillGapAnalysis({ candidateSkills, requiredSkills, skillGaps }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
    >
      <h3 className="font-semibold text-slate-900 mb-4">Skill Gap Analysis</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-3">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {requiredSkills.map((skill) => {
              const matched = !skillGaps.includes(skill)
              return (
                <span key={skill}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border
                    ${matched
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'}`}
                >
                  {matched ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {skill}
                </span>
              )
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-3">Your Skills</h4>
          <div className="flex flex-wrap gap-2">
            {candidateSkills.map((skill) => (
              <span key={skill}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
              >
                {skill}
              </span>
            ))}
            {candidateSkills.length === 0 && (
              <p className="text-sm text-slate-400">No skills extracted yet</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
