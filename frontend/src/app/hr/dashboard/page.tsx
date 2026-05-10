'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Briefcase, Users, TrendingUp, FileText, Sparkles, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { getJobs } from '@/api/jobs'
import { getAllApplications } from '@/api/applications'
import { getResumes } from '@/api/resumes'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'
import ChatPanel from '@/components/ai/ChatPanel'
import type { Job, Application } from '@/types'

const statConfig = [
  { label: 'Open Jobs', icon: Briefcase, gradient: 'from-blue-600 to-blue-400', badge: 'bg-blue-50 text-blue-600' },
  { label: 'Total Applications', icon: FileText, gradient: 'from-violet-600 to-purple-400', badge: 'bg-purple-50 text-purple-600' },
  { label: 'Candidates Hired', icon: Users, gradient: 'from-emerald-500 to-emerald-300', badge: 'bg-emerald-50 text-emerald-600' },
  { label: 'Avg Match Score', icon: TrendingUp, gradient: 'from-amber-500 to-orange-400', badge: 'bg-amber-50 text-amber-600' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export default function HRDashboard() {
  const { data: jobs, isLoading: jobsLoading } = useQuery({ queryKey: ['jobs'], queryFn: getJobs })
  const { data: applications, isLoading: appsLoading } = useQuery({ queryKey: ['applications'], queryFn: getAllApplications })
  const { data: resumes } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })

  const jobList: Job[] = (jobs as any)?.data || []
  const appList: Application[] = (applications as any)?.data || []
  const resumeCount = (resumes as any)?.count || 0

  const openJobs = jobList.filter((j) => j.status === 'open').length
  const hiredCount = appList.filter((a) => a.status === 'hired').length
  const avgScore = appList.length
    ? Math.round(appList.reduce((s, a) => s + (a.overall_score || 0), 0) / appList.length)
    : 0

  const statValues = [openJobs, appList.length, hiredCount, `${avgScore}%`]

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Decorative background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '0s' }} />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">HR Portal</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text">HR Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Overview of your hiring pipeline</p>
          </div>
          <Link href="/hr/jobs/create">
            <Button><Briefcase className="w-4 h-4" /> Post New Job</Button>
          </Link>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statConfig.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={s.label} variants={itemVariants}>
                <Card className="relative overflow-hidden group">
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
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Resume count chip */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 px-4 py-2 glass rounded-2xl w-fit text-sm text-slate-600">
          <FileText className="w-4 h-4 text-blue-500" />
          <span><strong className="text-slate-900">{resumeCount}</strong> resumes in the system</span>
        </motion.div>

        {/* Recent Job Postings */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Job Postings</h2>
            <Link href="/hr/jobs/create" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {jobsLoading ? (
            <div className="grid gap-4">
              <SkeletonCard /><SkeletonCard />
            </div>
          ) : jobList.length === 0 ? (
            <Card><p className="text-slate-400 text-center py-8">No jobs posted yet. Create your first job posting!</p></Card>
          ) : (
            <div className="space-y-3">
              {jobList.slice(0, 5).map((job) => {
                const jobApps = appList.filter((a) => a.job_id === job.id)
                return (
                  <Link key={job.id} href={`/hr/jobs/${job.id}`}>
                    <motion.div variants={itemVariants}
                      className="relative group bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-slate-200 transition-all duration-200"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {job.title.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{job.title}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">{job.description?.slice(0, 100)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full">{jobApps.length} applicants</span>
                          <Badge variant={job.status === 'open' ? 'success' : 'default'}>{job.status}</Badge>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Applications */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Applications</h2>
          </div>
          {appsLoading ? (
            <SkeletonTable rows={3} />
          ) : appList.length === 0 ? (
            <Card><p className="text-slate-400 text-center py-8">No applications yet</p></Card>
          ) : (
            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left p-4 font-semibold text-slate-600">Candidate</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Job</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Score</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appList.slice(0, 5).map((app, i) => (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-slate-50 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-150"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-bold">
                            {(app.candidate_name || 'U').charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">{app.candidate_name || 'Unknown'}</span>
                            {app.candidate_email && <p className="text-xs text-slate-400">{app.candidate_email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{app.job_title || `Job #${app.job_id}`}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          (app.overall_score || 0) >= 80 ? 'text-emerald-600' :
                          (app.overall_score || 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {app.overall_score >= 80 && <TrendingUp className="w-3.5 h-3.5" />}
                          {app.overall_score || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant={
                          app.status === 'hired' ? 'success' :
                          app.status === 'rejected' ? 'danger' :
                          app.status === 'withdrawn' ? 'default' :
                          app.status === 'analyzed' ? 'info' : 'warning'
                        }>
                          {app.status.replace('_', ' ')}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </motion.div>
      </div>
      <ChatPanel />
    </AppLayout>
  )
}
