import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Package, Calendar, DollarSign, FileText } from 'lucide-react'

interface Deal {
  id: string
  contractNumber: string
  buyerName: string
  sellerName: string
  productTitle: string
  totalValue: number
  currency: string
  status: 'draft' | 'active' | 'in_inspection' | 'in_payment' | 'completed' | 'disputed' | 'cancelled'
  progress: number
  nextMilestone: string
  nextMilestoneDate: string
}

export function Deals() {
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const res = await api.get('/deals')
      return res.data.items || []
    },
  })

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-blue-100 text-blue-700',
    in_inspection: 'bg-yellow-100 text-yellow-700',
    in_payment: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    disputed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deals</h2>
          <p className="text-sm text-gray-500 mt-1">Track and manage active trade deals</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading deals...</div>
      ) : deals.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No active deals. Accept a quotation to create your first deal.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {deals.map((deal: Deal) => (
            <Card key={deal.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{deal.contractNumber}</h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[deal.status]}`}>
                      {deal.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Buyer</p>
                      <p className="text-sm font-medium text-gray-900">{deal.buyerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Seller</p>
                      <p className="text-sm font-medium text-gray-900">{deal.sellerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Product</p>
                      <p className="text-sm font-medium text-gray-900">{deal.productTitle}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{deal.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${deal.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {deal.currency} {deal.totalValue.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Next: {deal.nextMilestone} ({deal.nextMilestoneDate})
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-6">
                  <Button variant="secondary" icon={<FileText className="w-4 h-4" />}>
                    View Contract
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
