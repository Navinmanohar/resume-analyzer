'use client'
import { motion } from 'framer-motion'
import { MapPin, Clock, Users } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { Job } from '@/types'

interface Props {
  job: Job
  applicantCount?: number
  onClick?: () => void
}

export default function JobCard({ job, applicantCount, onClick }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-900">{job.title}</h3>
        <Badge variant={job.status === 'open' ? 'success' : 'default'}>{job.status}</Badge>
      </div>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{job.description}</p>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        {job.experience_required && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {job.experience_required}
          </span>
        )}
        {typeof applicantCount !== 'undefined' && (
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {applicantCount} applicant{applicantCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {(job as any).skills_required?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {(job as any).skills_required.slice(0, 4).map((s: string) => (
            <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-xs font-medium border border-slate-100">
              {s}
            </span>
          ))}
          {(job as any).skills_required.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-slate-400">+{(job as any).skills_required.length - 4} more</span>
          )}
        </div>
      )}
    </motion.div>
  )
}
