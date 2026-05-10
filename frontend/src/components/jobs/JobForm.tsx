'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface Props {
  onSubmit: (data: { title: string; description: string; skills_required: string[]; experience_required: string }) => void
  loading?: boolean
}

export default function JobForm({ onSubmit, loading }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [experience, setExperience] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills([...skills, s])
    setSkillInput('')
  }

  const removeSkill = (s: string) => setSkills(skills.filter((k) => k !== s))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, description, skills_required: skills, experience_required: experience })
  }

  return (
    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="space-y-5">
      <Input label="Job Title" placeholder="e.g. Senior Frontend Developer" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          placeholder="Describe the role and responsibilities..."
          required
        />
      </div>
      <Input label="Experience Required" placeholder="e.g. 3-5 years" value={experience} onChange={(e) => setExperience(e.target.value)} />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Required Skills</label>
        <div className="flex gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="Type a skill and press Enter"
          />
          <Button type="button" variant="secondary" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>
      <Button type="submit" loading={loading} size="lg"><BriefcaseIcon className="w-4 h-4" /> Create Job</Button>
    </motion.form>
  )
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  )
}
