import { useQuery } from '@tanstack/react-query'
import {
  Handshake,
  AlertCircle,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import api from '@/lib/api'

interface DashboardStats {
  activeDeals: number
  pendingActions: number
  newRfqs: number
  trustScore: number
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  changeType,
}: {
  title: string
  value: string | number
  change?: string
  icon: React.ElementType
  changeType?: 'up' | 'down'
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {change && (
            <div className="mt-2 flex items-center gap-1">
              {changeType === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span
                className={
                  changeType === 'up' ? 'text-sm text-green-600' : 'text-sm text-red-600'
                }
              >
                {change}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-primary-50 rounded-lg">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
      </div>
    </div>
  )
}

function DealPipeline() {
  const stages = [
    { name: 'RFQ', count: 5, color: 'bg-gray-200' },
    { name: 'Quoting', count: 3, color: 'bg-blue-200' },
    { name: 'Contract', count: 2, color: 'bg-yellow-200' },
    { name: 'Inspection', count: 1, color: 'bg-purple-200' },
    { name: 'Payment', count: 1, color: 'bg-orange-200' },
    { name: 'Shipment', count: 0, color: 'bg-gray-200' },
  ]

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Pipeline</h3>
      <div className="flex gap-2">
        {stages.map((stage) => (
          <div key={stage.name} className="flex-1">
            <div
              className={`${stage.color} rounded-lg p-3 text-center transition-all hover:opacity-80`}
            >
              <p className="text-2xl font-bold text-gray-900">{stage.count}</p>
              <p className="text-xs font-medium text-gray-700 mt-1">{stage.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentActivity() {
  const activities = [
    { text: 'Quote accepted for Kenya AA Coffee', time: '2h ago', type: 'success' },
    { text: 'Inspection due for Ethiopia Sesame', time: '1d ago', type: 'warning' },
    { text: 'Payment released — $45,200', time: '2d ago', type: 'success' },
    { text: 'New RFQ: 50MT Cashews to Germany', time: '3d ago', type: 'info' },
  ]

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                activity.type === 'success'
                  ? 'bg-green-500'
                  : activity.type === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
            />
            <div>
              <p className="text-sm text-gray-900">{activity.text}</p>
              <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComplianceAlerts() {
  return (
    <div className="card border-yellow-200 bg-yellow-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-yellow-900">Compliance Alerts</h3>
          <ul className="mt-2 space-y-2 text-sm text-yellow-800">
            <li>Export license expires in 15 days</li>
            <li>2 products missing destination compliance for EU</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats')
      return res.data
    },
    // Fallback data for demo
    initialData: {
      activeDeals: 12,
      pendingActions: 5,
      newRfqs: 3,
      trustScore: 87,
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, here's your trade activity overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Deals"
          value={stats?.activeDeals ?? 0}
          change="+2 this week"
          changeType="up"
          icon={Handshake}
        />
        <StatCard
          title="Pending Actions"
          value={stats?.pendingActions ?? 0}
          icon={AlertCircle}
        />
        <StatCard
          title="New RFQs"
          value={stats?.newRfqs ?? 0}
          change="+1 today"
          changeType="up"
          icon={FileText}
        />
        <StatCard
          title="Trust Score"
          value={stats?.trustScore ?? 0}
          change="+3 this month"
          changeType="up"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DealPipeline />
        <RecentActivity />
      </div>

      <ComplianceAlerts />
    </div>
  )
}
