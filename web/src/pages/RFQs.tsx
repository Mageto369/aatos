import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Search, MessageSquare } from 'lucide-react'

interface RFQ {
  id: string
  title: string
  productCategory: string
  originCountry: string
  quantity: number
  unit: string
  targetPrice: number
  currency: string
  status: 'open' | 'closed' | 'expired' | 'cancelled'
  responseDeadline: string
  createdAt: string
}

export function RFQs() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['rfqs', statusFilter],
    queryFn: async () => {
      const res = await api.get('/rfqs', {
        params: statusFilter !== 'all' ? { status: statusFilter } : undefined,
      })
      return res.data.items || []
    },
  })

  const filtered = rfqs.filter((r: RFQ) =>
    search === '' ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.productCategory.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
    expired: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Requests for Quotation</h2>
          <p className="text-sm text-gray-500 mt-1">Browse and respond to buyer RFQs</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
          Create RFQ
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search RFQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading RFQs...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No RFQs found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rfq: RFQ) => (
              <div key={rfq.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{rfq.title}</h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[rfq.status]}`}>
                        {rfq.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{rfq.productCategory}</span>
                      <span>{rfq.originCountry}</span>
                      <span>{rfq.quantity.toLocaleString()} {rfq.unit}</span>
                      <span>Target: {rfq.currency} {rfq.targetPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button variant="secondary" icon={<MessageSquare className="w-4 h-4" />}>
                    Respond
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Deadline: {rfq.responseDeadline} · Posted: {rfq.createdAt}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
