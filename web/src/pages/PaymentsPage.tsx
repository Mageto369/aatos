import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  Wallet,
} from 'lucide-react'
import { api } from '@/lib/api'

interface Payment {
  id: string
  dealId: string
  milestoneId: string | null
  amount: number
  currency: string
  amountUsd: number | null
  status: 'pending' | 'held' | 'released' | 'refunded' | 'failed' | 'disputed'
  paymentMethod: string
  externalProvider: string | null
  externalReference: string | null
  platformFeeAmount: number | null
  releaseCondition: string | null
  releasedAt: string | null
  createdAt: string
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
  held: { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100', label: 'In Escrow' },
  released: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Released' },
  refunded: { icon: ArrowDownRight, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Refunded' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Failed' },
  disputed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Disputed' },
}

function PaymentCard({ payment }: { payment: Payment }) {
  const status = statusConfig[payment.status] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${status.bg}`}>
            <StatusIcon className={`w-6 h-6 ${status.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Payment #{payment.id.slice(-8)}</h3>
              <span className={`badge ${status.bg} ${status.color}`}>{status.label}</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Deal {payment.dealId.slice(-8)} · {payment.paymentMethod.replace('_', ' ')}
            </p>
            {payment.milestoneId && (
              <p className="text-xs text-gray-400 mt-0.5">Milestone: {payment.milestoneId.slice(-8)}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">
            {payment.currency} {payment.amount.toLocaleString()}
          </p>
          {payment.amountUsd && (
            <p className="text-sm text-gray-500">≈ ${payment.amountUsd.toLocaleString()} USD</p>
          )}
          {payment.platformFeeAmount && (
            <p className="text-xs text-gray-400 mt-1">Fee: ${payment.platformFeeAmount}</p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              Created {new Date(payment.createdAt).toLocaleDateString()}
            </span>
            {payment.releasedAt && (
              <span className="text-green-600">
                Released {new Date(payment.releasedAt).toLocaleDateString()}
              </span>
            )}
            {payment.releaseCondition && (
              <span className="text-gray-400">
                Condition: {payment.releaseCondition.replace('_', ' ')}
              </span>
            )}
          </div>
          {payment.externalReference && (
            <span className="text-xs text-gray-400 font-mono">
              Ref: {payment.externalReference}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, change, icon: Icon, trend }: {
  title: string
  value: string
  change?: string
  icon: any
  trend?: 'up' | 'down'
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <div className="mt-1 flex items-center gap-1">
              {trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span className={trend === 'up' ? 'text-sm text-green-600' : 'text-sm text-red-600'}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-primary-50 rounded-lg">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
      </div>
    </div>
  )
}

export function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('')

  const { data: payments, isLoading } = useQuery<{ items: Payment[]; total: number }>({
    queryKey: ['payments', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const res = await api.get(`/payments?${params}`)
      return res.data
    },
  })

  const displayPayments = payments?.items || []

  const stats = {
    totalPaid: displayPayments.filter(p => p.status === 'released').reduce((a, p) => a + (p.amountUsd || p.amount), 0),
    inEscrow: displayPayments.filter(p => p.status === 'held').reduce((a, p) => a + (p.amountUsd || p.amount), 0),
    pending: displayPayments.filter(p => p.status === 'pending').reduce((a, p) => a + (p.amountUsd || p.amount), 0),
    failed: displayPayments.filter(p => p.status === 'failed').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">Manage trade payments and escrow releases</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Paid" value={`$${stats.totalPaid.toLocaleString()}`} icon={Wallet} trend="up" />
        <StatCard title="In Escrow" value={`$${stats.inEscrow.toLocaleString()}`} icon={Shield} />
        <StatCard title="Pending" value={`$${stats.pending.toLocaleString()}`} icon={Clock} />
        <StatCard title="Failed" value={stats.failed.toString()} icon={XCircle} trend="down" />
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'held', 'released', 'failed'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f === 'all' ? '' : f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              (f === 'all' && !statusFilter) || statusFilter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading payments...</p>
        </div>
      ) : displayPayments.length === 0 ? (
        <div className="card text-center py-16">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="mt-4 text-gray-500">No payments found</p>
          <p className="text-sm text-gray-400">Payments will appear here when deals reach payment milestones</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayPayments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </div>
  )
}
