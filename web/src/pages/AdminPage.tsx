import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Building2,
  Handshake,
  FileQuestion,
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api'

interface PlatformStats {
  users: { total: number }
  organizations: { total: number }
  deals: { total: number; active: number; completed: number }
  rfqs: { total: number }
  payments: { total: number }
  volume: { totalUsd: number }
  platformFees: { totalUsd: number }
}

export function AdminPage() {
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats')
      return res.data
    },
  })

  const { data: activity } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const res = await api.get('/admin/activity?limit=10')
      return res.data
    },
  })

  const { data: orgs } = useQuery({
    queryKey: ['admin-orgs'],
    queryFn: async () => {
      const res = await api.get('/admin/organizations?limit=5')
      return res.data
    },
  })

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.users?.total ?? 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
    },
    {
      label: 'Organizations',
      value: stats?.organizations?.total ?? 0,
      icon: Building2,
      color: 'bg-emerald-500',
      trend: '+8%',
    },
    {
      label: 'Active Deals',
      value: stats?.deals?.active ?? 0,
      icon: Handshake,
      color: 'bg-amber-500',
      trend: '+24%',
    },
    {
      label: 'Total RFQs',
      value: stats?.rfqs?.total ?? 0,
      icon: FileQuestion,
      color: 'bg-purple-500',
      trend: '+15%',
    },
    {
      label: 'Trade Volume',
      value: `$${(stats?.volume?.totalUsd ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-rose-500',
      trend: '+32%',
    },
    {
      label: 'Platform Fees',
      value: `$${(stats?.platformFees?.totalUsd ?? 0).toLocaleString()}`,
      icon: CreditCard,
      color: 'bg-cyan-500',
      trend: '+18%',
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
          <Shield className="w-4 h-4" />
          Admin Access
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-medium text-green-600">{card.trend}</span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Organizations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Organizations</h2>
            <span className="text-xs text-gray-500">{(orgs?.total ?? 0).toLocaleString()} total</span>
          </div>
          <div className="divide-y divide-gray-100">
            {(orgs?.items || []).map((org: any) => (
              <div key={org.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.type} · {org.countryCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    org.status === 'verified' ? 'bg-green-100 text-green-700' :
                    org.status === 'pending_verification' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {org.status === 'verified' ? <CheckCircle className="w-3 h-3" /> :
                     org.status === 'pending_verification' ? <Clock className="w-3 h-3" /> :
                     <AlertTriangle className="w-3 h-3" />}
                    {org.status}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    org.verificationLevel === 'fully_verified' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {org.verificationLevel}
                  </span>
                </div>
              </div>
            ))}
            {(!orgs?.items || orgs.items.length === 0) && (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                No organizations yet.
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {(activity?.deals || []).slice(0, 5).map((deal: any) => (
              <div key={deal.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Handshake className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{deal.title}</p>
                    <p className="text-xs text-gray-500">New deal created · {new Date(deal.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {(activity?.rfqs || []).slice(0, 3).map((rfq: any) => (
              <div key={rfq.id} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileQuestion className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{rfq.title}</p>
                    <p className="text-xs text-gray-500">RFQ published · {new Date(rfq.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!activity || (!activity.deals?.length && !activity.rfqs?.length)) && (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                <Activity className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                No recent activity.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats?.deals?.completed ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Completed Deals</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats?.deals?.total ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Total Deals</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats?.payments?.total ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Payments</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats?.users?.total ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Registered Users</p>
        </div>
      </div>
    </div>
  )
}
