import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Plus, MapPin, Package } from 'lucide-react'
import api from '@/lib/api'

interface Product {
  id: string
  title: string
  organization: {
    name: string
    countryCode: string
    verificationLevel: string
    trustScore: number
  }
  priceFob: number
  priceCif: number
  currency: string
  availableQuantity: number
  availableUnit: string
  originCountry: string
  certifications: string[]
  primaryImageUrl: string | null
  status: string
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {product.primaryImageUrl ? (
            <img
              src={product.primaryImageUrl}
              alt={product.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Package className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">{product.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {product.organization.name} · {product.originCountry} · ★ Verified
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="font-semibold text-gray-900">
                ${product.priceFob}/{product.availableUnit}
              </p>
              <p className="text-xs text-gray-500">FOB</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              {product.availableQuantity} {product.availableUnit} avail
            </div>
            <div className="flex gap-1">
              {product.certifications.map((cert) => (
                <span key={cert} className="badge-success">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products', searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      const res = await api.get(`/products?${params}`)
      return res.data.data?.items || res.data.items || []
    },
  })

  // Demo data fallback
  const demoProducts: Product[] = [
    {
      id: '1',
      title: 'Kenya AA Arabica Coffee - Washed Process',
      organization: { name: 'Nairobi Coffee Exporters Ltd', countryCode: 'KE', verificationLevel: 'fully_verified', trustScore: 87 },
      priceFob: 4.85,
      priceCif: 5.45,
      currency: 'USD',
      availableQuantity: 500,
      availableUnit: 'mt',
      originCountry: 'KE',
      certifications: ['organic', 'fair_trade'],
      primaryImageUrl: null,
      status: 'published',
    },
    {
      id: '2',
      title: 'Ethiopia Yirgacheffe - Natural Process',
      organization: { name: 'Sidama Coffee Cooperative', countryCode: 'ET', verificationLevel: 'fully_verified', trustScore: 82 },
      priceFob: 5.20,
      priceCif: 5.90,
      currency: 'USD',
      availableQuantity: 300,
      availableUnit: 'mt',
      originCountry: 'ET',
      certifications: ['organic'],
      primaryImageUrl: null,
      status: 'published',
    },
    {
      id: '3',
      title: 'Nigerian Sesame Seeds - White Hulled',
      organization: { name: 'Lagos Agri Exports', countryCode: 'NG', verificationLevel: 'fully_verified', trustScore: 75 },
      priceFob: 1.85,
      priceCif: 2.20,
      currency: 'USD',
      availableQuantity: 1000,
      availableUnit: 'mt',
      originCountry: 'NG',
      certifications: [],
      primaryImageUrl: null,
      status: 'published',
    },
  ]

  const displayProducts = products?.length ? products : demoProducts

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Discover verified agricultural products from African suppliers</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input w-48"
        >
          <option value="">All Categories</option>
          <option value="coffee">Coffee</option>
          <option value="sesame">Sesame</option>
          <option value="cocoa">Cocoa</option>
          <option value="avocado">Avocado</option>
        </select>
        <button className="btn-secondary">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading products...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
