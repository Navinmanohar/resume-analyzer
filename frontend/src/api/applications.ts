import api from './client'

export const applyForJob = (resume_id: number, job_id: number) =>
  api.post('/applications', { resume_id, job_id }).then((r) => r.data.data)

export const getJobApplications = (jobId: number) =>
  api.get(`/jobs/${jobId}/applications`).then((r) => r.data.data)

export const getApplicationStatus = (id: number) =>
  api.get(`/applications/${id}`).then((r) => r.data.data)

export const shortlistJob = (jobId: number) =>
  api.post(`/jobs/${jobId}/shortlist`).then((r) => r.data.data)

export const analyzeResumeForJob = (resumeId: number, jobId: number) =>
  api.get(`/analyze/${resumeId}/${jobId}`).then((r) => r.data.data)

export const getAllApplications = () =>
  api.get('/applications').then((r) => r.data.data)

export const withdrawApplication = (appId: number) =>
  api.delete(`/applications/${appId}`).then((r) => r.data.data)
