import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Search, Filter, Plus } from 'lucide-react'

interface Quotation {
  id: string
  rfqId: string
  supplierName: string
  buyerName: string
  productTitle: string
  pricePerUnit: number
  currency: string
  totalPrice: number
  deliveryDate: string
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired'
  createdAt: string
}

export function Quotations() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data: quotations = [], isLoading, error } = useQuery({
    queryKey: ['quotations', statusFilter],
    queryFn: async () => {
      const res = await api.get('/quotations', {
        params: statusFilter !== 'all' ? { status: statusFilter } : undefined,
      })
      return res.data.items || []
    },
  })

  const filtered = quotations.filter((q: Quotation) =>
    search === '' ||
    q.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    q.productTitle.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quotations</h2>
          <p className="text-sm text-gray-500 mt-1">Manage supplier quotations and responses</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
          New Quotation
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by supplier or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading quotations...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">Failed to load quotations. Please try again later.</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No quotations found. Create your first quotation to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Delivery</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((q: Quotation) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{q.supplierName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{q.productTitle}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      {q.currency} {q.totalPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{q.deliveryDate}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[q.status] || 'bg-gray-100'}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{q.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
