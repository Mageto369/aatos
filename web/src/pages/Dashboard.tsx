import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { TrendingUp, Package, Users, DollarSign } from 'lucide-react'

export function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard')
      return res.data
    },
  })

  const cards = [
    { label: 'Active Deals', value: stats?.activeDeals || 0, icon: Package, color: 'text-blue-600' },
    { label: 'Total RFQs', value: stats?.totalRFQs || 0, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Organizations', value: stats?.totalOrganizations || 0, icon: Users, color: 'text-purple-600' },
    { label: 'Trade Volume', value: stats?.tradeVolume ? `$${stats.tradeVolume.toLocaleString()}` : '$0', icon: DollarSign, color: 'text-orange-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Overview of your trade operations</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${card.color}`} />
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-gray-500">Activity feed will appear here.</div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Milestones</h3>
          <div className="text-center py-8 text-gray-500">Milestone timeline will appear here.</div>
        </Card>
      </div>
    </div>
  )
}
