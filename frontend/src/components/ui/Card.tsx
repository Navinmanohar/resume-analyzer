'use client'
import { motion } from 'framer-motion'

interface Props {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6
        ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
