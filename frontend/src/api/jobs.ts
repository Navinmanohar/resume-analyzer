import api from './client'
import { Job } from '@/types'

export const getJobs = () =>
  api.get('/jobs').then((r) => r.data.data)

export const getJob = (id: number) =>
  api.get(`/jobs/${id}`).then((r) => r.data.data)

export const createJob = (data: Partial<Job>) =>
  api.post('/jobs', data).then((r) => r.data.data)

export const closeJob = (id: number) =>
  api.post(`/jobs/${id}/close`).then((r) => r.data.data)
