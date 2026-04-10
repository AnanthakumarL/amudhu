import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ClipboardList, Factory, RefreshCw, Eye } from 'lucide-react'
import { clsx } from 'clsx'
import { productionManagementAPI } from '../services/api'

const STATUS_STYLES = {
  planned: 'bg-blue-50 text-blue-700 border-blue-100',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-dark-100 text-dark-600 border-dark-200',
}

const normalizeStatus = (value) => {
  if (!value) return 'planned'
  return String(value).toLowerCase().replace(/\s+/g, '_')
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString()
}

const ProductionManagement = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await productionManagementAPI.list({ page: 1, page_size: 100 })
      setItems(res.data.data || [])
    } catch (error) {
      toast.error('Failed to load production managements')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const rows = useMemo(() => (Array.isArray(items) ? items : []), [items])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-dark-900">Production Management</h1>
          <p className="text-dark-500 mt-1">List and track production batches.</p>
        </div>
        <button onClick={fetchItems} className="btn-secondary flex items-center gap-2" type="button">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-100">
            <thead className="bg-dark-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Production Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-dark-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-dark-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-dark-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-dark-50 rounded-full flex items-center justify-center mb-4">
                        <Factory className="w-8 h-8 text-dark-300" />
                      </div>
                      <p className="text-lg font-medium text-dark-900">No production records found</p>
                      <p className="text-sm mt-1">Create production management entries to see them here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const status = normalizeStatus(row.status)
                  const statusClass = STATUS_STYLES[status] || 'bg-dark-100 text-dark-600 border-dark-200'

                  return (
                    <tr key={row.id} className="hover:bg-dark-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                            <ClipboardList className="w-5 h-5" />
                          </div>
                          <div className="text-sm font-medium text-dark-900">{row.name || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-600">{formatDate(row.production_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx('px-2.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full border', statusClass)}>
                          {String(row.status || 'planned')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-dark-900">{Number.isFinite(Number(row.quantity)) ? Number(row.quantity) : '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-dark-500 truncate max-w-md">{row.notes || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          className="btn-secondary inline-flex items-center gap-2"
                          onClick={() => navigate(`/production/${row.id}`)}
                          disabled={!row.id}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
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

export default ProductionManagement
