import { useState } from 'react'
import {
  Handshake,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  FileText,
  Truck,
} from 'lucide-react'

interface Deal {
  id: string
  title: string
  buyer: { name: string; countryCode: string }
  supplier: { name: string; countryCode: string }
  status: string
  totalValueUsd: number
  milestones: { type: string; status: string; label: string }[]
  progress: number
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

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{deal.title}</h3>
            <span className={`badge ${status.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {deal.buyer.name} → {deal.supplier.name} · ${deal.totalValueUsd.toLocaleString()}
          </p>
        </div>
        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{deal.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${deal.progress}%` }}
          />
        </div>

        <div className="flex gap-2 pt-2">
          {deal.milestones.map((m) => (
            <div
              key={m.type}
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
              {m.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DealsPage() {
  const [filter, setFilter] = useState('all')

  const demoDeals: Deal[] = [
    {
      id: '1',
      title: 'Kenya AA Coffee — 100MT to Hamburg',
      buyer: { name: 'Hamburg Specialty Roasters', countryCode: 'DE' },
      supplier: { name: 'Nairobi Coffee Exporters', countryCode: 'KE' },
      status: 'in_transit',
      totalValueUsd: 510000,
      progress: 67,
      milestones: [
        { type: 'contract', status: 'completed', label: 'Contract' },
        { type: 'payment', status: 'completed', label: 'Advance' },
        { type: 'inspection', status: 'completed', label: 'Inspection' },
        { type: 'shipment', status: 'in_progress', label: 'Shipment' },
        { type: 'delivery', status: 'pending', label: 'Delivery' },
      ],
    },
    {
      id: '2',
      title: 'Ethiopia Sesame — 200MT to Dubai',
      buyer: { name: 'Gulf Food Trading', countryCode: 'AE' },
      supplier: { name: 'Addis Agri Cooperative', countryCode: 'ET' },
      status: 'contract_signed',
      totalValueUsd: 380000,
      progress: 33,
      milestones: [
        { type: 'contract', status: 'completed', label: 'Contract' },
        { type: 'payment', status: 'in_progress', label: 'Advance' },
        { type: 'inspection', status: 'pending', label: 'Inspection' },
      ],
    },
    {
      id: '3',
      title: 'Nigeria Cocoa — 50MT to Amsterdam',
      buyer: { name: 'Dutch Cocoa Processing', countryCode: 'NL' },
      supplier: { name: 'Lagos Agri Exports', countryCode: 'NG' },
      status: 'negotiating',
      totalValueUsd: 175000,
      progress: 15,
      milestones: [
        { type: 'contract', status: 'in_progress', label: 'Contract' },
      ],
    },
  ]

  const filteredDeals = filter === 'all' ? demoDeals : demoDeals.filter((d) => d.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deal Rooms</h1>
          <p className="text-gray-600 mt-1">Manage your active trade transactions</p>
        </div>
      </div>

      <div className="flex gap-2">
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

      <div className="space-y-4">
        {filteredDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  )
}
