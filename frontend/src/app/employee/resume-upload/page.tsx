'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle, Eye } from 'lucide-react'
import { getResumes, uploadResume, getResume } from '@/api/resumes'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useUIStore } from '@/store/uiStore'

function parseSkills(r: any): string[] {
  if (!r.skills) return []
  if (Array.isArray(r.skills)) return r.skills
  try { return JSON.parse(r.skills) } catch { return [] }
}

function parseExp(r: any): any[] {
  if (!r.experience) return []
  if (Array.isArray(r.experience)) return r.experience
  try { return JSON.parse(r.experience) } catch { return [] }
}

function parseEdu(r: any): any[] {
  if (!r.education) return []
  if (Array.isArray(r.education)) return r.education
  try { return JSON.parse(r.education) } catch { return [] }
}

export default function ResumeUploadPage() {
  const queryClient = useQueryClient()
  const { showToast } = useUIStore()
  const [dragOver, setDragOver] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const { data: resumesRes, isLoading } = useQuery({ queryKey: ['resumes'], queryFn: getResumes })
  const resumeList: any[] = (resumesRes as any)?.data || []

  const { data: detailRes } = useQuery({
    queryKey: ['resume', detailId],
    queryFn: () => getResume(detailId!),
    enabled: !!detailId,
  })
  const detail: any = detailRes

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      showToast('Resume uploaded and analyzed successfully', 'success')
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      showToast('Please upload a PDF file', 'error')
      return
    }
    uploadMutation.mutate(file)
  }, [uploadMutation])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Resume</h1>
          <p className="text-slate-500 text-sm mt-1">Upload your resume for AI analysis</p>
        </div>

        <motion.div
          onDragOver={(e) => (e.preventDefault(), setDragOver(true))}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'
          }`}
        >
          <input
            type="file"
            accept=".pdf"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all ${
            dragOver ? 'bg-blue-100 scale-110' : 'bg-slate-50'
          }`}>
            <Upload className={`w-8 h-8 ${dragOver ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>
          <p className="font-medium text-slate-900 mb-1">
            {dragOver ? 'Drop your file here' : 'Drag and drop or click to upload'}
          </p>
          <p className="text-sm text-slate-400">PDF format only</p>
          {uploadMutation.isPending && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Analyzing your resume...
            </div>
          )}
        </motion.div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Uploaded Resumes</h2>
          {isLoading ? (
            <Card><div className="h-12 bg-slate-100 rounded-xl animate-pulse" /></Card>
          ) : resumeList.length === 0 ? (
            <Card><p className="text-slate-400 text-center py-6">No resumes uploaded yet</p></Card>
          ) : (
            <div className="space-y-3">
              {resumeList.map((r: any) => {
                const skills = parseSkills(r)
                const exp = parseExp(r)
                const edu = parseEdu(r)
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{r.filename}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{new Date(r.created_at).toLocaleDateString()}</span>
                            {r.candidate_name && <><span>·</span><span>{r.candidate_name}</span></>}
                            {r.candidate_email && <><span>·</span><span>{r.candidate_email}</span></>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {skills.length > 0 && <Badge variant="info">{skills.length} skills</Badge>}
                        <Button variant="ghost" size="sm" onClick={() => setDetailId(r.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                    </div>

                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {skills.slice(0, 8).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-xs font-medium border border-slate-100">{s}</span>
                        ))}
                        {skills.length > 8 && <span className="text-xs text-slate-400 self-center">+{skills.length - 8} more</span>}
                      </div>
                    )}

                    {exp.length > 0 && (
                      <div className="mt-3 text-xs text-slate-500">
                        {exp.map((e: any, i: number) => (
                          <span key={i}>{e.role} @ {e.company}{i < exp.length - 1 ? ' · ' : ''}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Resume Details">
        {detail ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-slate-900">{detail.filename}</p>
              {detail.candidate_name && <p className="text-slate-500">{detail.candidate_name} · {detail.candidate_email}</p>}
            </div>
            {parseSkills(detail).length > 0 && (
              <div>
                <p className="font-medium text-slate-700 mb-1.5">Skills ({parseSkills(detail).length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {parseSkills(detail).map((s: string) => (
                    <Badge key={s} variant="info">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {parseExp(detail).length > 0 && (
              <div>
                <p className="font-medium text-slate-700 mb-1.5">Experience</p>
                {parseExp(detail).map((e: any, i: number) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 mb-2">
                    <p className="font-medium text-slate-900">{e.role}</p>
                    <p className="text-slate-500 text-xs">{e.company} · {e.duration}</p>
                  </div>
                ))}
              </div>
            )}
            {parseEdu(detail).length > 0 && (
              <div>
                <p className="font-medium text-slate-700 mb-1.5">Education</p>
                {parseEdu(detail).map((e: any, i: number) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 mb-2">
                    <p className="font-medium text-slate-900">{e.degree}</p>
                    <p className="text-slate-500 text-xs">{e.college} · {e.year}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-full" />
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
