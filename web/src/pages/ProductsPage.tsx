import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Package, MapPin, Tag } from 'lucide-react'
import { api } from '@/lib/api'

interface Product {
  id: string
  name: string
  description: string
  category: string
  originCountry: string
  status: string
  minOrderQuantity: number
  unitOfMeasure: string
  pricePerUnit: number
  priceCurrency: string
  featuredImageUrl: string
}

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['products', categoryFilter],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: { category: categoryFilter || undefined, limit: 50 },
      })
      return res.data
    },
  })

  const products: Product[] = data?.items || []

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const categories = ['coffee', 'cocoa', 'tea', 'sesame', 'cashew', 'macadamia', 'avocado', 'spices', 'other']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Browse and manage agricultural products</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-44"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products found</p>
          <p className="text-sm text-gray-400 mt-1">Add your first product to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                <Package className="w-12 h-12 text-primary-300" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium capitalize">
                    {product.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    product.status === 'active' ? 'bg-green-100 text-green-700' :
                    product.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {product.status}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {product.originCountry || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    {product.minOrderQuantity} {product.unitOfMeasure}
                  </span>
                </div>
                {product.pricePerUnit && (
                  <p className="mt-3 text-lg font-bold text-gray-900">
                    {product.priceCurrency} {product.pricePerUnit.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">/{product.unitOfMeasure}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
