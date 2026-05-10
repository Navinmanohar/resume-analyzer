'use client'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '@/components/layout/AppLayout'
import JobForm from '@/components/jobs/JobForm'
import { createJob } from '@/api/jobs'
import { useUIStore } from '@/store/uiStore'

export default function CreateJobPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useUIStore()

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      showToast('Job created successfully', 'success')
      router.push(`/hr/jobs/${res.job_id}`)
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create New Job</h1>
          <p className="text-slate-500 text-sm mt-1">Post a new position to start receiving applications</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <JobForm onSubmit={(data) => mutation.mutate(data as any)} loading={mutation.isPending} />
        </div>
      </div>
    </AppLayout>
  )
}
