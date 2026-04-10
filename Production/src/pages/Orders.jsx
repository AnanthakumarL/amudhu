import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { Package } from 'lucide-react'
import { ordersAPI } from '../services/api'
import { getStoredUser } from '../services/authStorage'

const PRODUCTION_STATUS_OPTIONS = [
  { value: 'order_received', label: 'Order received' },
  { value: 'started', label: 'Started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'ready_to_dispatch', label: 'Ready to dispatch' },
]

const getOrderStatusColor = (status) => {
  const colors = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-violet-100 text-violet-800 border-violet-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[String(status || '').toLowerCase()] || 'bg-dark-100 text-dark-800 border-dark-200'
}

const formatStatusLabel = (value) => {
  const s = String(value || '').trim()
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const Orders = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [updatingById, setUpdatingById] = useState({})

  const fetchOrders = async () => {
    setLoading(true)
    setError('')

    try {
      const user = getStoredUser()
      const identifier = String(user?.identifier || '').trim().toLowerCase()
      if (!identifier) {
        setOrders([])
        setError('Not logged in')
        return
      }

      const res = await ordersAPI.list({ page: 1, page_size: 100, production_identifier: identifier })

      const payload = res?.data
      if (Array.isArray(payload?.data)) {
        setOrders(payload.data)
      } else {
        setOrders([])
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const rows = useMemo(() => {
    return orders.map((o) => {
      const id = o.id || o._id || ''
      const orderNumber = o.order_number || o.orderNumber || ''
      const customer =
        o.customer_name ||
        o.customer?.name ||
        o.user?.name ||
        o.user?.email ||
        o.customer_email ||
        o.email ||
        '—'
      const orderStatus = o.status || o.order_status || '—'
      const productionStatus = o.production_status || o.productionStatus || 'order_received'
      const total = o.total_amount ?? o.total ?? o.grand_total ?? 0
      const createdAt = o.created_at || o.createdAt || o.date || ''

      return {
        raw: o,
        id,
        orderNumber,
        customer,
        orderStatus,
        productionStatus,
        total,
        createdAt,
      }
    })
  }, [orders])

  const updateProductionStatus = async (orderId, nextStatus) => {
    if (!orderId) return

    setUpdatingById((prev) => ({ ...prev, [orderId]: true }))
    try {
      await ordersAPI.update(orderId, { production_status: nextStatus })
      setOrders((prev) =>
        prev.map((o) => {
          const id = o.id || o._id
          if (id !== orderId) return o
          return { ...o, production_status: nextStatus }
        }),
      )
      toast.success('Production status updated')
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to update status'
      toast.error(msg)
    } finally {
      setUpdatingById((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-dark-900">Orders</h1>
          <p className="text-dark-500 mt-1">Track and update production progress</p>
        </div>

        <button className="btn-secondary" onClick={fetchOrders} type="button" disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? <div className="card p-4 text-red-600">{error}</div> : null}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-100">
            <thead className="bg-dark-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Production Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {loading ? (
                <tr>
                  <td className="px-6 py-10 text-center text-dark-500" colSpan={6}>
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                      <span>Loading orders…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-dark-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-dark-50 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-dark-300" />
                      </div>
                      <p className="text-lg font-medium text-dark-900">No orders found</p>
                      <p className="text-sm mt-1">Assigned orders will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const saving = Boolean(updatingById[r.id])
                  return (
                    <tr key={r.id} className="hover:bg-dark-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-violet-700 font-mono">
                          {r.orderNumber ? `#${r.orderNumber}` : r.id ? `#${String(r.id).slice(-8)}` : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-dark-900">{r.customer}</div>
                        <div className="text-xs text-dark-400">{r.id || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-dark-900">₹{Number(r.total || 0).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={clsx(
                            'px-2.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full border',
                            getOrderStatusColor(r.orderStatus),
                          )}
                        >
                          {formatStatusLabel(r.orderStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="h-9 min-w-[200px] px-3 bg-white border border-dark-200 rounded-lg text-sm text-dark-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none disabled:opacity-60"
                          value={r.productionStatus}
                          disabled={saving}
                          onChange={(e) => updateProductionStatus(r.id, e.target.value)}
                        >
                          {PRODUCTION_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {saving ? <div className="text-xs text-dark-400 mt-1">Saving…</div> : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-600">{r.createdAt ? String(r.createdAt) : '—'}</div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Orders
