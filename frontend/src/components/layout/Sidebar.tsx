'use client'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, FileText, BarChart3, Users,
  Upload, X,
} from 'lucide-react'

const hrLinks = [
  { href: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/hr/jobs/create', label: 'Post Job', icon: Briefcase },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const employeeLinks = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/jobs', label: 'Browse Jobs', icon: Briefcase },
  { href: '/employee/resume-upload', label: 'My Resume', icon: Upload },
]

export default function Sidebar() {
  const { isHR } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const pathname = usePathname()
  const links = isHR ? hrLinks : employeeLinks

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={toggleSidebar} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-40
        transform transition-transform duration-200 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-slate-900">HireFlow AI</span>
          </div>
          <button onClick={toggleSidebar} className="p-1 rounded-lg hover:bg-slate-100 lg:hidden">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pt-4 pb-2">
            {isHR ? 'HR Management' : 'Employee'}
          </p>
          {links.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
