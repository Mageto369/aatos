import { Outlet, Link, useLocation } from 'react-router-dom'
import { BarChart3, FileText, ClipboardCheck, Shield, MessageSquare, Package, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/rfqs', label: 'RFQs', icon: MessageSquare },
  { path: '/quotations', label: 'Quotations', icon: FileText },
  { path: '/deals', label: 'Deals', icon: Package },
  { path: '/compliance', label: 'Compliance', icon: Shield },
  { path: '/documents', label: 'Documents', icon: ClipboardCheck },
  { path: '/inspections', label: 'Inspections', icon: BarChart3 },
]

export function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">AATOS</h1>
          <p className="text-xs text-gray-500 mt-1">Trade Operating System</p>
        </div>
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  )
}
