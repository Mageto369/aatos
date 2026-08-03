import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ClipboardCheck, Calendar, MapPin, CheckCircle, AlertTriangle, Plus } from 'lucide-react'

interface Inspection {
  id: string
  dealId: string
  type: 'pre_shipment' | 'loading' | 'discharge' | 'warehouse'
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  inspectorName: string
  location: string
  scheduledDate: string
  result?: string
}

export function Inspections() {
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['inspections', statusFilter],
    queryFn: async () => {
      const res = await api.get('/inspections', {
        params: statusFilter !== 'all' ? { status: statusFilter } : undefined,
      })
      return res.data.items || []
    },
  })

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inspections</h2>
          <p className="text-sm text-gray-500 mt-1">Manage quality inspections across the supply chain</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
          Schedule Inspection
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading inspections...</div>
        ) : inspections.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No inspections scheduled. Create your first inspection to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {inspections.map((inspection: Inspection) => (
              <div key={inspection.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {inspection.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {inspection.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {inspection.scheduledDate}
                        </span>
                        <span>Inspector: {inspection.inspectorName}</span>
                      </div>
                      {inspection.result && (
                        <p className="mt-2 text-sm text-gray-600">{inspection.result}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[inspection.status]}`}>
                    {inspection.status.replace('_', ' ')}
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
