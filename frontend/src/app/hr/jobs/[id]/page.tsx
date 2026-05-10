'use client'
import { use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, XCircle, Users, UserCheck, UserX } from 'lucide-react'
import Link from 'next/link'
import { getJob } from '@/api/jobs'
import { getJobApplications, shortlistJob } from '@/api/applications'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useUIStore } from '@/store/uiStore'
import type { Application } from '@/types'

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const jobId = parseInt(id)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useUIStore()

  const { data: jobRes, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
  })
  const { data: appsRes, isLoading: appsLoading } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: () => getJobApplications(jobId),
  })

  const job = (jobRes as any)?.data
  const applications: Application[] = (appsRes as any)?.data || []

  const shortlistMutation = useMutation({
    mutationFn: () => shortlistJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] })
      showToast('Shortlisting complete', 'success')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await import('@/api/jobs').then((m) => m.closeJob(jobId))
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      showToast('Job closed', 'success')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const strongApps = applications.filter((a) => a.overall_score >= 80)
  const mediumApps = applications.filter((a) => a.overall_score >= 60 && a.overall_score < 80)
  const weakApps = applications.filter((a) => a.overall_score < 60)

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => router.push('/hr/dashboard')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {jobLoading ? (
          <SkeletonCard />
        ) : job ? (
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
                <p className="text-slate-500 mt-1">{job.description}</p>
                {job.experience_required && (
                  <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
                    <Clock className="w-4 h-4" /> {job.experience_required}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={job.status === 'open' ? 'success' : 'default'}>{job.status}</Badge>
                {job.status === 'open' && (
                  <Button variant="danger" size="sm" loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
                    <XCircle className="w-4 h-4" /> Close
                  </Button>
                )}
              </div>
            </div>
            {job.skills_required?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {job.skills_required.map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-sm border border-slate-100">{s}</span>
                ))}
              </div>
            )}
          </Card>
        ) : null}

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-600" /></div>
              <div><p className="text-xs text-slate-500">Strong Match (80+)</p><p className="text-xl font-bold text-emerald-600">{strongApps.length}</p></div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><UserCheck className="w-5 h-5 text-amber-600" /></div>
              <div><p className="text-xs text-slate-500">Medium Match (60-79)</p><p className="text-xl font-bold text-amber-600">{mediumApps.length}</p></div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><UserX className="w-5 h-5 text-red-600" /></div>
              <div><p className="text-xs text-slate-500">Low Match (&lt;60)</p><p className="text-xl font-bold text-red-600">{weakApps.length}</p></div>
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Applicants ({applications.length})</h2>
          <div className="flex gap-2">
            <Button
              variant="primary"
              loading={shortlistMutation.isPending}
              onClick={() => shortlistMutation.mutate()}
              disabled={applications.length === 0}
            >
              <UserCheck className="w-4 h-4" /> Run Shortlist
            </Button>
            <Link href={`/hr/jobs/${jobId}/applicants`}>
              <Button variant="secondary">View All</Button>
            </Link>
          </div>
        </div>

        {appsLoading ? (
          <div className="grid gap-3"><SkeletonCard /><SkeletonCard /></div>
        ) : applications.length === 0 ? (
          <Card><p className="text-slate-400 text-center py-8">No applications yet for this position</p></Card>
        ) : (
          <div className="space-y-3">
            {[...strongApps, ...mediumApps, ...weakApps].slice(0, 10).map((app) => (
              <motion.div key={app.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      app.overall_score >= 80 ? 'bg-emerald-500' :
                      app.overall_score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}>
                      {(app.candidate_name || '?')[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{app.candidate_name || 'Unknown'}</p>
                      {app.candidate_email && <p className="text-xs text-slate-400">{app.candidate_email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        app.overall_score >= 80 ? 'text-emerald-600' :
                        app.overall_score >= 60 ? 'text-amber-600' : 'text-red-600'
                      }`}>{app.overall_score}%</p>
                      <p className="text-xs text-slate-400">Overall</p>
                    </div>
                    <Badge variant={
                      app.status === 'hired' ? 'success' :
                      app.status === 'rejected' ? 'danger' :
                      app.status === 'withdrawn' ? 'default' :
                      app.status === 'analyzed' ? 'info' : 'warning'
                    }>
                      {app.status.replace('_', ' ')}
                    </Badge>
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
