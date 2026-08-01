import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Calendar, MapPin, ClipboardCheck, CheckCircle, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface Inspection {
  id: string
  inspectionType: string
  status: string
  inspectionLocation: string
  scheduledDate: string
  completedAt: string
  findings: string
  passFailStatus: string
  inspectorName: string
}

const typeLabels: Record<string, string> = {
  pre_shipment: 'Pre-Shipment',
  loading: 'Loading',
  discharge: 'Discharge',
  destination: 'Destination',
  quality: 'Quality',
  quantity: 'Quantity',
  packaging: 'Packaging',
}

export function InspectionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', statusFilter],
    queryFn: async () => {
      const res = await api.get('/inspections', {
        params: { status: statusFilter || undefined },
      })
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/inspections', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
      setShowCreateModal(false)
    },
  })

  const inspections: Inspection[] = data?.items || []

  const filtered = inspections.filter((i) =>
    i.inspectionLocation?.toLowerCase().includes(search.toLowerCase()) ||
    typeLabels[i.inspectionType]?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      case 'in_progress': return <Clock className="w-4 h-4 text-amber-500" />
      default: return <ClipboardCheck className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
          <p className="text-gray-600 mt-1">Book and track inspections for your trade deals</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Book Inspection
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search inspections..."
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
          <option value="requested">Requested</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No inspections found</p>
          <p className="text-sm text-gray-400 mt-1">Book your first inspection to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((inspection) => (
            <div
              key={inspection.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {typeLabels[inspection.inspectionType] || inspection.inspectionType}
                    </h3>
                    <span className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-medium',
                      inspection.status === 'completed' && 'bg-green-100 text-green-700',
                      inspection.status === 'in_progress' && 'bg-amber-100 text-amber-700',
                      inspection.status === 'failed' && 'bg-red-100 text-red-700',
                      inspection.status === 'scheduled' && 'bg-blue-100 text-blue-700',
                      inspection.status === 'requested' && 'bg-gray-100 text-gray-700',
                    )}>
                      {inspection.status}
                    </span>
                    {inspection.passFailStatus && (
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        inspection.passFailStatus === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {inspection.passFailStatus.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {inspection.inspectionLocation || 'Location TBD'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {inspection.scheduledDate
                        ? new Date(inspection.scheduledDate).toLocaleDateString()
                        : 'Not scheduled'}
                    </span>
                    {inspection.inspectorName && (
                      <span>Inspector: {inspection.inspectorName}</span>
                    )}
                  </div>
                  {inspection.findings && (
                    <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                      {inspection.findings}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  {getStatusIcon(inspection.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Book New Inspection</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                createMutation.mutate({
                  dealId: formData.get('dealId'),
                  inspectionType: formData.get('inspectionType'),
                  inspectionLocation: formData.get('location'),
                  scheduledDate: formData.get('scheduledDate'),
                  notes: formData.get('notes'),
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deal ID</label>
                <input name="dealId" type="text" required className="input w-full" placeholder="Enter deal ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Inspection Type</label>
                <select name="inspectionType" required className="input w-full">
                  <option value="pre_shipment">Pre-Shipment</option>
                  <option value="loading">Loading</option>
                  <option value="discharge">Discharge</option>
                  <option value="destination">Destination</option>
                  <option value="quality">Quality</option>
                  <option value="quantity">Quantity</option>
                  <option value="packaging">Packaging</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <input name="location" type="text" required className="input w-full" placeholder="e.g. Mombasa Port" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Date</label>
                <input name="scheduledDate" type="date" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea name="notes" rows={3} className="input w-full" placeholder="Any special requirements..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending ? 'Booking...' : 'Book Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
