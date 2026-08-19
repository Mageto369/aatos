import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react'

export function ComplianceDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['compliance-stats'],
    queryFn: async () => {
      const res = await api.get('/compliance/stats')
      return res.data
    },
  })

  const { data: checklist } = useQuery({
    queryKey: ['compliance-checklists'],
    queryFn: async () => {
      const res = await api.get('/compliance/checklists')
      return res.data.items || []
    },
  })

  const statsCards = [
    { label: 'Verified Organizations', value: stats?.verifiedCount || 0, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Pending Review', value: stats?.pendingCount || 0, icon: Clock, color: 'text-yellow-600' },
    { label: 'Flagged Issues', value: stats?.flaggedCount || 0, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Compliance Score', value: `${stats?.averageScore || 0}%`, icon: Shield, color: 'text-blue-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Monitor verification status and compliance across all organizations</p>
      </div>

      {/* PLATFORM_ROLE.md is binding: AATOS is not a customs broker, inspector,
          certifier or guarantor. Stating that only in the terms is not enough —
          this screen is where a user forms the belief that the platform has
          checked something. */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">These checklists are guidance, not clearance.</span>{' '}
          AATOS is not a customs broker, inspector or certifying authority. Requirements
          are compiled from published sources and may be incomplete or out of date, and
          uploaded certificates are stored and tracked but <span className="font-semibold">not
          verified with the issuing body</span>. Confirm every requirement with your licensed
          broker before shipping.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Compliance Checklists</h3>
        {!checklist || checklist.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No active checklists found.</div>
        ) : (
          <div className="space-y-3">
            {checklist.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${item.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{item.progress || 0}% complete</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === 'compliant' ? 'bg-green-100 text-green-700' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
