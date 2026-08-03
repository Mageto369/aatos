import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Upload, FileText, CheckCircle, AlertTriangle, Search } from 'lucide-react'

interface Document {
  id: string
  title: string
  type: string
  organizationName: string
  status: 'uploaded' | 'pending_review' | 'verified' | 'rejected' | 'expired'
  uploadedAt: string
  reviewedBy?: string
  reviewedAt?: string
}

export function Documents() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', statusFilter],
    queryFn: async () => {
      const res = await api.get('/documents', {
        params: statusFilter !== 'all' ? { status: statusFilter } : undefined,
      })
      return res.data.items || []
    },
  })

  const filtered = documents.filter((d: Document) =>
    search === '' ||
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.organizationName.toLowerCase().includes(search.toLowerCase())
  )

  const statusConfig: Record<string, { icon: typeof FileText; color: string; label: string }> = {
    uploaded: { icon: Upload, color: 'text-gray-600', label: 'Uploaded' },
    pending_review: { icon: AlertTriangle, color: 'text-yellow-600', label: 'Pending Review' },
    verified: { icon: CheckCircle, color: 'text-green-600', label: 'Verified' },
    rejected: { icon: AlertTriangle, color: 'text-red-600', label: 'Rejected' },
    expired: { icon: AlertTriangle, color: 'text-gray-400', label: 'Expired' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Review</h2>
          <p className="text-sm text-gray-500 mt-1">Review and verify organization documents</p>
        </div>
        <Button variant="primary" icon={<Upload className="w-4 h-4" />}>
          Upload Document
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
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
            <option value="uploaded">Uploaded</option>
            <option value="pending_review">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading documents...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No documents found.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((d: Document) => {
              const config = statusConfig[d.status]
              const Icon = config?.icon || FileText
              return (
                <div key={d.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${config?.color || 'text-gray-600'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{d.title}</p>
                      <p className="text-sm text-gray-500">{d.organizationName} · {d.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      d.status === 'verified' ? 'bg-green-100 text-green-700' :
                      d.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                      d.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {config?.label || d.status}
                    </span>
                    <span className="text-sm text-gray-500">{d.uploadedAt}</span>
                    <Button variant="ghost">Review</Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
