import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Factory, RefreshCw, ClipboardList, TrendingUp } from 'lucide-react'
import { productionManagementAPI } from '../services/api'

const normalizeStatus = (value) => {
  if (!value) return 'planned'
  return String(value).toLowerCase().replace(/\s+/g, '_')
}

const Dashboard = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await productionManagementAPI.list({ page: 1, page_size: 200 })
      setItems(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
    const id = setInterval(fetchItems, 5000)
    return () => clearInterval(id)
  }, [])

  const stats = useMemo(() => {
    const rows = Array.isArray(items) ? items : []
    const counts = { total: rows.length, planned: 0, in_progress: 0, completed: 0, cancelled: 0 }
    for (const row of rows) {
      const s = normalizeStatus(row.status)
      if (counts[s] !== undefined) counts[s] += 1
    }
    return counts
  }, [items])

  const cards = [
    { title: 'Total Batches', value: stats.total, icon: ClipboardList },
    { title: 'Planned', value: stats.planned, icon: TrendingUp },
    { title: 'In Progress', value: stats.in_progress, icon: RefreshCw },
    { title: 'Completed', value: stats.completed, icon: Factory },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-dark-900">Production Dashboard</h1>
          <p className="text-dark-500 mt-1">Realtime overview of production management data.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="btn-secondary flex items-center gap-2" type="button">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <Link to="/production" className="btn-primary">View Production</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div key={c.title} className="bg-white p-6 rounded-2xl shadow-sm border border-dark-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-dark-500">{c.title}</div>
                <div className="text-2xl font-bold text-dark-900 mt-2">{c.value}</div>
              </div>
              <div className="bg-violet-50 text-violet-700 p-3 rounded-xl">
                <c.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark-900">Latest Production Records</h2>
          <Link to="/production" className="text-sm text-violet-600 hover:text-violet-700 font-medium">View All</Link>
        </div>
        <div className="space-y-3">
          {(Array.isArray(items) ? items : []).slice(0, 5).map((row) => (
            <div key={row.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                <Factory className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-dark-900 truncate">{row.name || '-'}</div>
                <div className="text-xs text-dark-500 truncate">{row.status || 'planned'}</div>
              </div>
              <div className="text-sm font-medium text-dark-900">{Number.isFinite(Number(row.quantity)) ? Number(row.quantity) : '-'}</div>
            </div>
          ))}
          {(!items || items.length === 0) && (
            <div className="text-sm text-dark-500">No production records yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
