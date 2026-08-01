import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Handshake,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  FileText,
  Truck,
  ArrowRight,
} from 'lucide-react'
import api from '@/lib/api'

interface Deal {
  id: string
  title: string
  buyerOrgName: string
  supplierOrgName: string
  status: string
  totalValueUsd: number
  progress: number
  milestones: { milestoneType: string; status: string; sequenceOrder: number }[]
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  negotiating: { color: 'bg-gray-100 text-gray-800', icon: Handshake, label: 'Negotiating' },
  contract_signed: { color: 'bg-blue-100 text-blue-800', icon: FileText, label: 'Contract Signed' },
  inspection_scheduled: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Inspection' },
  in_transit: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'In Transit' },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Completed' },
}

function DealCard({ deal }: { deal: Deal }) {
  const status = statusConfig[deal.status] || statusConfig.negotiating
  const StatusIcon = status.icon
  const progress = deal.milestones
    ? Math.round((deal.milestones.filter((m) => m.status === 'completed').length / Math.max(deal.milestones.length, 1)) * 100)
    : 0

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{deal.title}</h3>
            <span className={`badge ${status.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {deal.buyerOrgName} → {deal.supplierOrgName} · ${deal.totalValueUsd?.toLocaleString()}
          </p>
        </div>
        <Link
          to={`/deals/${deal.id}`}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Enter Room
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {deal.milestones && deal.milestones.length > 0 && (
          <div className="flex gap-2 pt-2 flex-wrap">
            {deal.milestones.map((m) => (
              <div
                key={m.sequenceOrder}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  m.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : m.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {m.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                {m.status === 'in_progress' && <Clock className="w-3 h-3" />}
                {m.status === 'pending' && <AlertCircle className="w-3 h-3" />}
                {m.milestoneType.replace('_', ' ')}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function DealsPage() {
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['deals', filter],
    queryFn: async () => {
      const res = await api.get('/deals', { params: { status: filter === 'all' ? undefined : filter } })
      return res.data
    },
  })

  const deals: Deal[] = data?.items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deal Rooms</h1>
          <p className="text-gray-600 mt-1">Manage your active trade transactions</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'negotiating', 'contract_signed', 'in_transit', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Handshake className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No deals yet</p>
          <p className="text-sm text-gray-400 mt-1">Create an RFQ to start a deal</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  )
}
