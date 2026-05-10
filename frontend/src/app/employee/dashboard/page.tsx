'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Briefcase, FileText, TrendingUp, CheckCircle, Sparkles, ArrowUpRight, XCircle } from 'lucide-react'
import Link from 'next/link'
import { getResumes } from '@/api/resumes'
import { getAllApplications, withdrawApplication } from '@/api/applications'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import MatchScoreCard from '@/components/ai/MatchScoreCard'
import ChatPanel from '@/components/ai/ChatPanel'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import type { Application } from '@/types'

const statConfig = [
  { label: 'Applications', icon: FileText, gradient: 'from-blue-600 to-blue-400', badge: 'bg-blue-50 text-blue-600' },
  { label: 'Active Jobs', icon: Briefcase, gradient: 'from-violet-600 to-purple-400', badge: 'bg-purple-50 text-purple-600', link: '/employee/jobs' },
  { label: 'Best Score', icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-300', badge: 'bg-emerald-50 text-emerald-600' },
  { label: 'Hired', icon: CheckCircle, gradient: 'from-amber-500 to-orange-400', badge: 'bg-amber-50 text-amber-600' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export default function EmployeeDashboard() {
  const { user } = useAuthStore()

  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })
  const { data: appsRes, isLoading: appsLoading } = useQuery({ queryKey: ['applications'], queryFn: getAllApplications })

  const resumeList: any[] = (resumes as any)?.data || []
  const allApps: Application[] = (appsRes as any)?.data || []
  const myApps = allApps

  const hasResume = resumeList.length > 0
  const latestApp = [...myApps].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  const bestScore = myApps.length ? Math.max(...myApps.map((a) => a.overall_score || 0)) : 0

  const queryClient = useQueryClient()
  const { showToast } = useUIStore()

  const withdrawMutation = useMutation({
    mutationFn: withdrawApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      showToast('Application withdrawn', 'success')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const statValues = [myApps.length, 'View', bestScore ? `${bestScore}%` : '-', myApps.filter((a) => a.status === 'hired').length]

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Decorative background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-violet-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '0s' }} />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/20 to-emerald-200/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        {/* Welcome banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Employee Portal</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Welcome, {user?.name || 'Employee'}</h1>
              <p className="text-slate-300 text-sm mt-1">Track your job applications and match scores</p>
            </div>
          </div>
        </motion.div>

        {/* Resume upload prompt */}
        {!hasResume && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 0.95 }}>
            <Card className="relative overflow-hidden border-blue-200/50">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 to-transparent" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Upload your resume to get started</p>
                  <p className="text-sm text-blue-700 mt-1">AI will analyze your skills and match you with relevant jobs</p>
                </div>
                <Link href="/employee/resume-upload">
                  <Button><FileText className="w-4 h-4" /> Upload Resume</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stat Cards */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statConfig.map((s, i) => {
            const Icon = s.icon
            const inner = (
              <Card className="relative overflow-hidden group h-full">
                <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors">{s.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{statValues[i]}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.badge} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            )
            if (s.link) {
              return (
                <Link key={s.label} href={s.link}>
                  <motion.div variants={itemVariants}>{inner}</motion.div>
                </Link>
              )
            }
            return <motion.div key={s.label} variants={itemVariants}>{inner}</motion.div>
          })}
        </motion.div>

        {/* Latest Application */}
        {latestApp && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Latest Application</h2>
              <Link href="/employee/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                Browse jobs <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <MatchScoreCard
                  skillScore={latestApp.skill_score || 0}
                  expScore={latestApp.exp_score || 0}
                  overallScore={latestApp.overall_score || 0}
                />
              </motion.div>
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-full" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {(latestApp.job_title || 'J').charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{latestApp.job_title || `Job #${latestApp.job_id}`}</h3>
                        <p className="text-xs text-slate-400">Applied {new Date(latestApp.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {latestApp.feedback && (
                      <p className="text-sm text-slate-600 mb-4 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">{latestApp.feedback}</p>
                    )}
                    {latestApp.skill_gaps?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Skill Gaps</p>
                        <div className="flex flex-wrap gap-1.5">
                          {latestApp.skill_gaps.map((g: string) => (
                            <Badge key={g} variant="danger">{g}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {latestApp.status !== 'withdrawn' && latestApp.status !== 'hired' && latestApp.status !== 'rejected' && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => withdrawMutation.mutate(latestApp.id)}
                          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Withdraw Application
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* All Applications */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Application History</h2>
            <span className="text-sm text-slate-400">{myApps.length} total</span>
          </div>
          {appsLoading ? (
            <div className="grid gap-3"><SkeletonCard /><SkeletonCard /></div>
          ) : myApps.length === 0 ? (
            <Card>
              <p className="text-slate-400 text-center py-8">
                No applications yet.{' '}
                <Link href="/employee/jobs" className="text-blue-600 font-medium">Browse open positions</Link>
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...myApps].reverse().map((app, i) => (
                <motion.div
                  key={app.id}
                  variants={itemVariants}
                  className="relative group bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-slate-200 transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {(app.job_title || 'J').charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{app.job_title || `Job #${app.job_id}`}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{new Date(app.created_at).toLocaleDateString()}</span>
                          <span className="text-slate-300">·</span>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-semibold ${
                              app.overall_score >= 80 ? 'text-emerald-600' :
                              app.overall_score >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>{app.overall_score || '-'}%</span>
                            <span className="text-xs text-slate-400">match</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        app.status === 'hired' ? 'success' :
                        app.status === 'rejected' ? 'danger' :
                        app.status === 'withdrawn' ? 'default' :
                        app.status === 'analyzed' ? 'info' : 'warning'
                      }>
                        {app.status.replace('_', ' ')}
                      </Badge>
                      {app.status !== 'withdrawn' && app.status !== 'hired' && app.status !== 'rejected' && (
                        <button
                          onClick={() => withdrawMutation.mutate(app.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Withdraw application"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <ChatPanel />
    </AppLayout>
  )
}
