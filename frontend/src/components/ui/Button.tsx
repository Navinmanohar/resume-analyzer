'use client'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'text-slate-600 hover:bg-slate-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children, onClick, variant = 'primary', size = 'md',
  loading, disabled, className = '', type = 'button',
}: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200
        ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  )
}
