'use client'
import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getJob } from '@/api/jobs'
import { getJobApplications } from '@/api/applications'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import MatchScoreCard from '@/components/ai/MatchScoreCard'
import AnalysisPanel from '@/components/ai/AnalysisPanel'
import SkillGapAnalysis from '@/components/ai/SkillGapAnalysis'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { Application } from '@/types'

export default function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const jobId = parseInt(id)
  const router = useRouter()

  const { data: jobRes } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
  })
  const { data: appsRes, isLoading } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: () => getJobApplications(jobId),
  })

  const job = (jobRes as any)?.data
  const applications: Application[] = (appsRes as any)?.data || []

  const strongApps = applications.filter((a) => a.overall_score >= 80)
  const mediumApps = applications.filter((a) => a.overall_score >= 60 && a.overall_score < 80)
  const weakApps = applications.filter((a) => a.overall_score < 60)

  const sections = [
    { label: 'Strong Match', apps: strongApps, color: 'emerald', icon: TrendingUp },
    { label: 'Medium Match', apps: mediumApps, color: 'amber', icon: Minus },
    { label: 'Low Match', apps: weakApps, color: 'red', icon: TrendingDown },
  ]

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => router.push(`/hr/jobs/${jobId}`)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back to Job
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">{job?.title || 'Job'} — Applicants</h1>
          <p className="text-slate-500 text-sm mt-1">{applications.length} total applications</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : applications.length === 0 ? (
          <Card><p className="text-slate-400 text-center py-8">No applications yet</p></Card>
        ) : (
          sections.map(({ label, apps, color, icon: Icon }) =>
            apps.length > 0 && (
              <div key={label}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                  <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
                  <Badge variant={color as any}>{apps.length}</Badge>
                </div>
                <div className="space-y-4">
                  {apps.map((app) => (
                    <Card key={app.id}>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-${color}-500`}>
                              {(app.candidate_name || '?')[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{app.candidate_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400">{app.candidate_email}</p>
                            </div>
                          </div>
                          <MatchScoreCard
                            skillScore={app.skill_score || 0}
                            expScore={app.exp_score || 0}
                            overallScore={app.overall_score || 0}
                            verdict={app.status.replace('_', ' ')}
                          />
                        </div>
                        <div>
                          <AnalysisPanel
                            feedback={app.feedback || 'Analysis complete.'}
                            strengths={app.strengths}
                            skillGaps={app.skill_gaps}
                          />
                        </div>
                        <div>
                          <SkillGapAnalysis
                            candidateSkills={(() => { try { return JSON.parse(app.skills || '[]') } catch { return [] } })()}
                            requiredSkills={job?.skills_required || []}
                            skillGaps={app.skill_gaps || []}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )
        )}
      </div>
    </AppLayout>
  )
}
