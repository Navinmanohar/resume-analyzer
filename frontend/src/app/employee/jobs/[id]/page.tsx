'use client'
import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Briefcase, Clock, Zap, FileText, CheckCircle } from 'lucide-react'
import { getJob } from '@/api/jobs'
import { getResumes } from '@/api/resumes'
import { applyForJob, analyzeResumeForJob, getAllApplications } from '@/api/applications'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import MatchScoreCard from '@/components/ai/MatchScoreCard'
import AnalysisPanel from '@/components/ai/AnalysisPanel'
import SkillGapAnalysis from '@/components/ai/SkillGapAnalysis'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useUIStore } from '@/store/uiStore'
import type { MatchAnalysis } from '@/types'

export default function EmployeeJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const jobId = parseInt(id)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useUIStore()
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)

  const { data: jobRes, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
  })
  const { data: resumesRes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })
  const { data: appsRes } = useQuery({ queryKey: ['applications'], queryFn: getAllApplications })

  const job = (jobRes as any)?.data
  const resumeList: any[] = (resumesRes as any)?.data || []
  const allApps: any[] = (appsRes as any)?.data || []

  if (!selectedResumeId && resumeList.length > 0) {
    setSelectedResumeId(resumeList[resumeList.length - 1].id)
  }

  const hasApplied = !!selectedResumeId && allApps.some((a) => a.job_id === jobId && a.resume_id === selectedResumeId)

  const { data: analysisRes, isLoading: analyzing } = useQuery({
    queryKey: ['analyze', selectedResumeId, jobId],
    queryFn: () => analyzeResumeForJob(selectedResumeId!, jobId),
    enabled: !!selectedResumeId && !!jobId,
  })

  const analysis: MatchAnalysis = (analysisRes as any)?.analysis

  const applyMutation = useMutation({
    mutationFn: () => applyForJob(selectedResumeId!, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      showToast('Application submitted!', 'success')
      router.push('/employee/dashboard')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const selectedResume = resumeList.find((r) => r.id === selectedResumeId)

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => router.push('/employee/jobs')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </button>

        {jobLoading ? (
          <SkeletonCard />
        ) : job ? (
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
                  <Badge variant="success">Open</Badge>
                </div>
                <p className="text-slate-500">{job.description}</p>
                {job.experience_required && (
                  <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-3">
                    <Clock className="w-4 h-4" /> {job.experience_required}
                  </p>
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

        {resumeList.length > 0 ? (
          <Card>
            <label className="block text-sm font-medium text-slate-700 mb-2">Match Against Resume</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedResumeId ?? ''}
                  onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                >
                  {resumeList.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.filename} {r.candidate_name ? `— ${r.candidate_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-800">
              Upload your resume first to see match scores.{' '}
              <a href="/employee/resume-upload" className="underline font-medium">Upload now</a>
            </p>
          </Card>
        )}

        {analyzing ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonCard /><div className="lg:col-span-2"><SkeletonCard /></div>
          </div>
        ) : analysis ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MatchScoreCard
                skillScore={analysis.skill_score}
                expScore={analysis.exp_score}
                overallScore={analysis.overall_score}
                verdict={analysis.verdict}
              />
              <div className="lg:col-span-2">
                <AnalysisPanel
                  feedback={analysis.feedback}
                  strengths={analysis.strengths}
                  skillGaps={analysis.skill_gaps}
                />
              </div>
            </div>
            <SkillGapAnalysis
              candidateSkills={(() => { try { const s = selectedResume?.skills; return Array.isArray(s) ? s : JSON.parse(s || '[]') } catch { return [] } })()}
              requiredSkills={job?.skills_required || []}
              skillGaps={analysis.skill_gaps}
            />
            <div className="text-center">
              {hasApplied ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium text-sm">
                  <CheckCircle className="w-5 h-5" /> Already Applied
                </div>
              ) : (
                <Button size="lg" onClick={() => applyMutation.mutate()} loading={applyMutation.isPending}>
                  <Briefcase className="w-4 h-4" /> Apply for this Job
                </Button>
              )}
            </div>
          </motion.div>
        ) : selectedResumeId ? (
          <Card><p className="text-slate-400 text-center py-6">Select a resume to see match analysis</p></Card>
        ) : null}
      </div>
    </AppLayout>
  )
}
