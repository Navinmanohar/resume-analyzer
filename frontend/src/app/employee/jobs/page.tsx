'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Briefcase, FileText, Zap } from 'lucide-react'
import { getJobs } from '@/api/jobs'
import { getResumes } from '@/api/resumes'
import { applyForJob } from '@/api/applications'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useUIStore } from '@/store/uiStore'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Job } from '@/types'

export default function BrowseJobsPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { showToast } = useUIStore()
  const [search, setSearch] = useState('')
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)

  const { data: jobsRes, isLoading } = useQuery({ queryKey: ['jobs'], queryFn: getJobs })
  const { data: resumesRes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })

  const jobs: Job[] = (jobsRes as any)?.data || []
  const resumeList: any[] = (resumesRes as any)?.data || []
  const hasResume = resumeList.length > 0

  if (!selectedResumeId && resumeList.length > 0) {
    setSelectedResumeId(resumeList[resumeList.length - 1].id)
  }

  const openJobs = jobs.filter((j) => j.status === 'open')

  const filtered = search
    ? openJobs.filter((j) =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.description.toLowerCase().includes(search.toLowerCase())
      )
    : openJobs

  const applyMutation = useMutation({
    mutationFn: (jobId: number) => applyForJob(selectedResumeId!, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      showToast('Application submitted! AI is analyzing your resume...', 'success')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const selectedResume = resumeList.find((r) => r.id === selectedResumeId)

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">Find and apply to open positions</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs by title or keyword..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
        </div>

        {!hasResume ? (
          <Card className="border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-800">
              Upload your resume first to apply for jobs.{' '}
              <a href="/employee/resume-upload" className="underline font-medium">Upload now</a>
            </p>
          </Card>
        ) : (
          <Card>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Resume to Apply With</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedResumeId ?? ''}
                  onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                >
                  {resumeList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.filename} {r.candidate_name ? `— ${r.candidate_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {selectedResume && (
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {selectedResume?.skills ? (() => { const s = selectedResume.skills; if (Array.isArray(s)) return s.length; try { return JSON.parse(s).length } catch { return 0 } })() : 0} skills
                </div>
              )}
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : filtered.length === 0 ? (
          <Card><p className="text-slate-400 text-center py-8">{search ? 'No jobs match your search' : 'No open positions available'}</p></Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => router.push(`/employee/jobs/${job.id}`)}
                className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{job.title}</h3>
                      <Badge variant="success">Open</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{job.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {job.experience_required && <span>{job.experience_required}</span>}
                      {(job as any).skills_required?.length > 0 && (
                        <span>{(job as any).skills_required.length} skills required</span>
                      )}
                    </div>
                    {(job as any).skills_required?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(job as any).skills_required.map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-xs font-medium border border-slate-100">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <Button
                      variant="primary" size="sm"
                      onClick={(e) => { e.stopPropagation(); applyMutation.mutate(job.id); }}
                      loading={applyMutation.isPending}
                      disabled={!selectedResumeId || applyMutation.isPending}
                    >
                      <Briefcase className="w-4 h-4" /> Apply
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/employee/jobs/${job.id}`); }}>
                      <Zap className="w-4 h-4" /> Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
