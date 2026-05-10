import api from './client'

export const uploadResume = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/upload-resume', fd).then((r) => r.data.data)
}

export const getResumes = () =>
  api.get('/resumes').then((r) => r.data.data)

export const getResume = (id: number) =>
  api.get(`/resume/${id}`).then((r) => r.data.data)
