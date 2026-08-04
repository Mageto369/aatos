import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Calendar, MapPin, Tag, FileQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface RFQ {
  id: string
  title: string
  productCategory: string
  quantity: number
  quantityUnit: string
  deliveryCountry: string
  status: string
  publishedAt: string
  quoteReceivedCount: number
}

export function RfqsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const { data, isLoading } = useQuery({
    queryKey: ['rfqs', statusFilter],
    queryFn: async () => {
      const res = await api.get('/rfqs', { params: { status: statusFilter || undefined } })
      return res.data
    },
  })

  const rfqs: RFQ[] = data?.items || []

  const filtered = rfqs.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.productCategory.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request for Quotations</h1>
          <p className="text-gray-600 mt-1">Browse and manage RFQs across the platform</p>
        </div>
        <Link
          to="/rfqs/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New RFQ
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search RFQs by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-40"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <FileQuestion className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No RFQs found</p>
          <Link to="/rfqs/new" className="text-primary-600 font-medium mt-2 inline-block">
            Create your first RFQ
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rfq.title}</h3>
                    <span className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-medium',
                      rfq.status === 'published' && 'bg-green-100 text-green-700',
                      rfq.status === 'draft' && 'bg-gray-100 text-gray-700',
                      rfq.status === 'closed' && 'bg-red-100 text-red-700',
                    )}>
                      {rfq.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {rfq.productCategory}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {rfq.deliveryCountry}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {rfq.publishedAt ? new Date(rfq.publishedAt).toLocaleDateString() : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {rfq.quantity.toLocaleString()} <span className="text-sm font-normal text-gray-500">{rfq.quantityUnit}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {rfq.quoteReceivedCount} quotes received
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
