import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Plus } from 'lucide-react'
import { api } from '@/lib/api'

export function RfqCreatePage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productCategory: '',
    quantity: '',
    quantityUnit: 'MT',
    targetPrice: '',
    targetPriceCurrency: 'USD',
    deliveryCountry: '',
    deliveryCity: '',
    deliveryMethod: 'fob',
    paymentTerms: 'letter_of_credit',
    requiredCertifications: [] as string[],
    responseDeadline: '',
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/rfqs', data)
      return res.data
    },
    onSuccess: () => {
      navigate('/rfqs')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      quantity: Number(formData.quantity),
      targetPrice: formData.targetPrice ? Number(formData.targetPrice) : null,
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/rfqs')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to RFQs
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New RFQ</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input w-full"
            placeholder="e.g. Organic Coffee Beans - Ethiopia Grade 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input w-full"
            placeholder="Describe your requirements in detail..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Category *</label>
            <select
              required
              value={formData.productCategory}
              onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
              className="input w-full"
            >
              <option value="">Select category</option>
              <option value="coffee">Coffee</option>
              <option value="cocoa">Cocoa</option>
              <option value="tea">Tea</option>
              <option value="sesame">Sesame</option>
              <option value="cashew">Cashew</option>
              <option value="macadamia">Macadamia</option>
              <option value="avocado">Avocado</option>
              <option value="spices">Spices</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity *</label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="input flex-1"
                placeholder="100"
              />
              <select
                value={formData.quantityUnit}
                onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                className="input w-24"
              >
                <option value="MT">MT</option>
                <option value="kg">kg</option>
                <option value="tons">Tons</option>
                <option value="bags">Bags</option>
                <option value="containers">Containers</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Price</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                className="input flex-1"
                placeholder="0.00"
              />
              <select
                value={formData.targetPriceCurrency}
                onChange={(e) => setFormData({ ...formData, targetPriceCurrency: e.target.value })}
                className="input w-24"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Response Deadline</label>
            <input
              type="date"
              value={formData.responseDeadline}
              onChange={(e) => setFormData({ ...formData, responseDeadline: e.target.value })}
              className="input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Country *</label>
            <input
              type="text"
              required
              value={formData.deliveryCountry}
              onChange={(e) => setFormData({ ...formData, deliveryCountry: e.target.value })}
              className="input w-full"
              placeholder="e.g. Germany"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery City</label>
            <input
              type="text"
              value={formData.deliveryCity}
              onChange={(e) => setFormData({ ...formData, deliveryCity: e.target.value })}
              className="input w-full"
              placeholder="e.g. Hamburg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Method</label>
            <select
              value={formData.deliveryMethod}
              onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
              className="input w-full"
            >
              <option value="fob">FOB</option>
              <option value="cif">CIF</option>
              <option value="exw">EXW</option>
              <option value="ddp">DDP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              className="input w-full"
            >
              <option value="letter_of_credit">Letter of Credit</option>
              <option value="advance_payment">Advance Payment</option>
              <option value="open_account">Open Account</option>
              <option value="documentary_collection">Documentary Collection</option>
            </select>
          </div>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-600">
            Failed to create RFQ. Please try again.
          </p>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/rfqs')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create RFQ
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
