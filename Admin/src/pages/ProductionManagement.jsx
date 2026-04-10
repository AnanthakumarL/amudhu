import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardList, RefreshCw, Eye, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { ordersAPI, usersAPI } from '../services/api';

const getOrderStatusColor = (status) => {
  const colors = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-violet-100 text-violet-800 border-violet-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[String(status || '').toLowerCase()] || 'bg-dark-100 text-dark-800 border-dark-200';
};

const getProductionStatusColor = (status) => {
  const colors = {
    order_received: 'bg-blue-50 text-blue-700 border-blue-100',
    started: 'bg-amber-50 text-amber-700 border-amber-100',
    in_progress: 'bg-violet-50 text-violet-700 border-violet-100',
    ready_to_dispatch: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return colors[String(status || '').toLowerCase()] || 'bg-dark-100 text-dark-600 border-dark-200';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const ProductionManagement = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('reports');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const [ordersRes, usersRes] = await Promise.all([
        ordersAPI.list({ page: 1, page_size: 100, production_assigned: true }),
        usersAPI.list({ page: 1, page_size: 100, production_only: true }),
      ]);

      setItems(ordersRes?.data?.data || []);
      setLogins(usersRes?.data?.data || []);
    } catch (error) {
      toast.error('Failed to load production data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const rows = useMemo(() => {
    return Array.isArray(items) ? items : [];
  }, [items]);

  const loginRows = useMemo(() => {
    return (Array.isArray(logins) ? logins : []).map((u) => ({
      id: u.id,
      name: u.name,
      identifier: u.identifier,
      is_active: Boolean(u.is_active),
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));
  }, [logins]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-dark-900">Production Management</h1>
          <p className="text-dark-500 mt-1">
            {activeSection === 'logins'
              ? 'Production portal login users.'
              : 'Orders assigned to production.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="inline-flex rounded-xl border border-dark-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveSection('reports')}
              className={clsx(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2',
                activeSection === 'reports'
                  ? 'bg-violet-600 text-white'
                  : 'text-dark-700 hover:bg-dark-50'
              )}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Production Reports</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('logins')}
              className={clsx(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2',
                activeSection === 'logins'
                  ? 'bg-violet-600 text-white'
                  : 'text-dark-700 hover:bg-dark-50'
              )}
            >
              <Users className="w-4 h-4" />
              <span>Production Logins</span>
            </button>
          </div>

          <button
            onClick={fetchItems}
            className="btn-secondary flex items-center justify-center gap-2"
            type="button"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {activeSection === 'logins' ? (
        <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-100">
            <div className="text-sm font-semibold text-dark-900">Production Logins</div>
            <div className="text-xs text-dark-500 mt-1">Logins used to access the Production portal (based on assigned orders).</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-100">
              <thead className="bg-dark-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Identifier</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {loginRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-dark-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-dark-50 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-dark-300" />
                        </div>
                        <p className="text-lg font-medium text-dark-900">No production logins found</p>
                        <p className="text-sm mt-1">They will appear after orders are assigned to production.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  loginRows.map((r) => (
                    <tr key={r.id} className="hover:bg-dark-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-dark-900">{r.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-700">{r.identifier || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={r.is_active
                            ? 'px-2.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'px-2.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full border bg-red-50 text-red-700 border-red-100'
                          }
                        >
                          {r.is_active ? 'active' : 'disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-600">{formatDate(r.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-600">{formatDate(r.updated_at)}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-100">
              <thead className="bg-dark-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Production</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Order Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Production Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-dark-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-dark-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-dark-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-dark-50 rounded-full flex items-center justify-center mb-4">
                          <ClipboardList className="w-8 h-8 text-dark-300" />
                        </div>
                        <p className="text-lg font-medium text-dark-900">No assigned orders found</p>
                        <p className="text-sm mt-1">Orders will appear here after they are assigned to production.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-dark-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-violet-700 font-mono">
                          #{row.order_number || row.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-dark-900">{row.customer_name || '-'}</div>
                        <div className="text-sm text-dark-500">{row.customer_email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-700">{row.production_identifier || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={clsx(
                            'px-2.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full border',
                            getOrderStatusColor(row.status)
                          )}
                        >
                          {String(row.status || '-').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={clsx(
                            'px-2.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full border',
                            getProductionStatusColor(row.production_status)
                          )}
                        >
                          {String(row.production_status || '-').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-dark-900">
                          {Number.isFinite(Number(row.total)) ? Number(row.total).toFixed(2) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-600">{formatDate(row.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          className="btn-secondary inline-flex items-center gap-2"
                          onClick={() => navigate(`/orders/${row.id}`)}
                          disabled={!row.id}
                          title="View order"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionManagement;
