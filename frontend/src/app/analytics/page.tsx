'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getJobs } from '@/api/jobs'
import { getAllApplications } from '@/api/applications'
import { getResumes } from '@/api/resumes'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import HiringFunnel from '@/components/charts/HiringFunnel'
import ScoreDistribution from '@/components/charts/ScoreDistribution'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { Application } from '@/types'

export default function AnalyticsPage() {
  const { data: jobsRes, isLoading: jobsLoading } = useQuery({ queryKey: ['jobs'], queryFn: getJobs })
  const { data: appsRes, isLoading: appsLoading } = useQuery({ queryKey: ['applications'], queryFn: getAllApplications })
  const { data: resumesRes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })

  const jobs: any[] = (jobsRes as any)?.data || []
  const applications: Application[] = (appsRes as any)?.data || []
  const resumeCount = (resumesRes as any)?.count || 0

  const analyzed = applications.filter((a) => a.status !== 'applied').length
  const shortlisted = applications.filter((a) => a.status === 'strong_shortlist' || a.status === 'medium_shortlist').length
  const hired = applications.filter((a) => a.status === 'hired').length
  const scores = applications.map((a) => a.overall_score || 0).filter((s) => s > 0)

  const strongCount = scores.filter((s) => s >= 80).length
  const mediumCount = scores.filter((s) => s >= 60 && s < 80).length
  const weakCount = scores.filter((s) => s < 60).length

  if (jobsLoading || appsLoading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <SkeletonCard /><SkeletonCard />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Hiring metrics and candidate insights</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-slate-500">Total Jobs</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{jobs.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Total Resumes</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{resumeCount}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Total Applications</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{applications.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Hire Rate</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {applications.length ? Math.round((hired / applications.length) * 100) : 0}%
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HiringFunnel
            applications={applications.length}
            analyzed={analyzed}
            shortlisted={shortlisted}
            hired={hired}
          />
          <ScoreDistribution scores={scores} />
        </div>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Score Breakdown</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{strongCount}</p>
              <p className="text-sm text-emerald-700 mt-1">Strong (80+)</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">{mediumCount}</p>
              <p className="text-sm text-amber-700 mt-1">Medium (60-79)</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-600">{weakCount}</p>
              <p className="text-sm text-red-700 mt-1">Low (&lt;60)</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">All Applications</h3>
          {applications.length === 0 ? (
            <p className="text-slate-400 text-center py-6">No applications to show</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-3 font-medium text-slate-500">Candidate</th>
                    <th className="text-left p-3 font-medium text-slate-500">Job</th>
                    <th className="text-left p-3 font-medium text-slate-500">Skills</th>
                    <th className="text-left p-3 font-medium text-slate-500">Experience</th>
                    <th className="text-left p-3 font-medium text-slate-500">Overall</th>
                    <th className="text-left p-3 font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-medium text-slate-900">{app.candidate_name || 'Unknown'}</span>
                      </td>
                      <td className="p-3 text-slate-600">{app.job_title || `Job #${app.job_id}`}</td>
                      <td className="p-3">
                        <span className={`font-medium ${(app.skill_score || 0) >= 80 ? 'text-emerald-600' : (app.skill_score || 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {app.skill_score || '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-medium ${(app.exp_score || 0) >= 80 ? 'text-emerald-600' : (app.exp_score || 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {app.exp_score || '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${(app.overall_score || 0) >= 80 ? 'text-emerald-600' : (app.overall_score || 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {app.overall_score || '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant={
                          app.status === 'hired' ? 'success' :
                          app.status === 'rejected' ? 'danger' :
                          app.status === 'withdrawn' ? 'default' :
                          app.status === 'analyzed' ? 'info' : 'warning'
                        }>
                          {app.status.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
