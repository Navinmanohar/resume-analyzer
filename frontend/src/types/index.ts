export interface Job {
  id: number
  title: string
  description: string
  skills_required: string[]
  experience_required: string
  status: 'open' | 'closed'
  created_at: string
}

export interface Resume {
  id: number
  filename: string
  candidate_name?: string
  candidate_email?: string
  skills?: string[]
  experience?: any[]
  education?: any[]
  created_at: string
}

export interface Application {
  id: number
  job_id: number
  resume_id: number
  status: 'applied' | 'analyzed' | 'strong_shortlist' | 'medium_shortlist' | 'rejected' | 'hired' | 'withdrawn'
  skill_score: number
  exp_score: number
  overall_score: number
  feedback?: string
  skill_gaps: string[]
  strengths?: string[]
  filename?: string
  candidate_name?: string
  candidate_email?: string
  skills?: string
  job_title?: string
  created_at: string
}

export interface MatchAnalysis {
  skill_score: number
  exp_score: number
  overall_score: number
  feedback: string
  skill_gaps: string[]
  strengths: string[]
  verdict: string
}

export interface ShortlistResult {
  job_title: string
  strong_shortlist: { count: number; candidates: any[] }
  medium_shortlist: { count: number; candidates: any[] }
  rejected: { count: number; candidates: any[] }
  total: number
}

export interface User {
  id: string
  email: string
  name: string
  role: 'hr' | 'employee'
}
