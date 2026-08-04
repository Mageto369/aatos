import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Handshake,
  Package,
  FileQuestion,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { api } from '@/lib/api'

export function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [dealsRes, productsRes, rfqsRes, docsRes] = await Promise.all([
        api.get('/deals?limit=1'),
        api.get('/products?limit=1'),
        api.get('/rfqs?limit=1'),
        api.get('/documents?limit=1'),
      ])
      return {
        deals: dealsRes.data.total || 0,
        products: productsRes.data.total || 0,
        rfqs: rfqsRes.data.total || 0,
        documents: docsRes.data.total || 0,
      }
    },
  })

  const { data: recentDeals } = useQuery({
    queryKey: ['recent-deals'],
    queryFn: async () => {
      const res = await api.get('/deals?limit=5')
      return res.data.items || []
    },
  })

  const statCards = [
    { label: 'Active Deals', value: stats?.deals || 0, icon: Handshake, color: 'bg-blue-500', href: '/deals' },
    { label: 'Products', value: stats?.products || 0, icon: Package, color: 'bg-green-500', href: '/products' },
    { label: 'RFQs', value: stats?.rfqs || 0, icon: FileQuestion, color: 'bg-amber-500', href: '/rfqs' },
    { label: 'Documents', value: stats?.documents || 0, icon: FileText, color: 'bg-purple-500', href: '/documents' },
  ]

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value.toLocaleString()}</p>
              </div>
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deals */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Deals</h2>
            <Link to="/deals" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(recentDeals || []).map((deal: any) => (
              <Link
                key={deal.id}
                to={`/deals/${deal.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{deal.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {deal.buyerOrgName || 'Buyer'} → {deal.supplierOrgName || 'Supplier'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${deal.totalValueUsd?.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    deal.status === 'active' ? 'bg-green-100 text-green-700' :
                    deal.status === 'negotiating' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {deal.status}
                  </span>
                </div>
              </Link>
            ))}
            {(!recentDeals || recentDeals.length === 0) && (
              <div className="px-6 py-8 text-center text-gray-500">
                <Handshake className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No deals yet. Create an RFQ to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity / Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/rfqs/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary-50 transition-colors">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileQuestion className="w-4 h-4 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Create RFQ</span>
              </Link>
              <Link to="/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Add Product</span>
              </Link>
              <Link to="/documents" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Upload Document</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Platform Status</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">API: Operational</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">WebSocket: Connected</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">Database: Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
