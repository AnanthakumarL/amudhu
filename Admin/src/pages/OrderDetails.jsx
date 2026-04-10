import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { ordersAPI, productsAPI } from '../services/api';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const getStatusColor = (status) => {
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

const OrderDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);

  const [productionIdentifier, setProductionIdentifier] = useState('');
  const [assigningProduction, setAssigningProduction] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchDetails = async () => {
    if (!id) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      const [orderRes, productsRes] = await Promise.all([
        ordersAPI.get(id),
        productsAPI.list({ page: 1, page_size: 100 }),
      ]);

      const orderData = orderRes?.data || null;
      setOrder(orderData);
      setProductionIdentifier(String(orderData?.production_identifier || ''));

      const productsData = productsRes?.data?.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      toast.error('Failed to load order details');
      console.error(error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const productNameById = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      if (p?.id) map.set(String(p.id), p?.name || '');
    }
    return map;
  }, [products]);

  const items = useMemo(() => {
    const list = Array.isArray(order?.items) ? order.items : [];
    return list.map((item) => {
      const name =
        item?.product_name ||
        productNameById.get(String(item?.product_id || '')) ||
        'Unknown Product';
      const qty = Number(item?.quantity || 0);
      const price = Number(item?.price || 0);
      const lineTotal = Number(item?.subtotal ?? price * qty);
      return {
        ...item,
        _name: name,
        _qty: qty,
        _price: price,
        _lineTotal: lineTotal,
      };
    });
  }, [order?.items, productNameById]);

  const isProductionAssigned = Boolean(order?.production_identifier);

  const assignToProduction = async () => {
    const identifier = productionIdentifier.trim().toLowerCase();
    if (!identifier) {
      toast.error('Enter production email / identifier');
      return;
    }

    if (!order?.id) {
      toast.error('Order not loaded');
      return;
    }

    try {
      setAssigningProduction(true);
      const res = await ordersAPI.update(order.id, { production_identifier: identifier });
      toast.success(isProductionAssigned ? 'Order transferred to another production' : 'Order assigned to production');
      setOrder(res?.data || order);
    } catch (error) {
      toast.error(isProductionAssigned ? 'Failed to transfer order' : 'Failed to assign order');
      console.error(error);
    } finally {
      setAssigningProduction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button type="button" className="btn-secondary flex items-center gap-2" onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6 text-dark-600">Order not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-secondary flex items-center gap-2"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div>
            <h1 className="text-3xl font-bold font-heading text-dark-900">Order #{order.order_number || order.id}</h1>
            <p className="text-dark-500 mt-1">Created: {formatDateTime(order.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={clsx(
              'px-2.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full border',
              getStatusColor(order.status)
            )}
          >
            {String(order.status || 'pending').toUpperCase()}
          </span>

          <button onClick={fetchDetails} className="btn-secondary flex items-center gap-2" type="button">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6">
          <h2 className="text-sm font-semibold text-dark-900 uppercase tracking-wider mb-4">Customer details</h2>
          <div className="space-y-2 text-sm">
            <div className="text-dark-900 font-medium">{order.customer_name || '-'}</div>
            <div className="text-dark-600">{order.customer_email || '-'}</div>
            <div className="text-dark-600">{order.customer_phone || '-'}</div>
            <div className="text-dark-600">{order.customer_identifier || '-'}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6">
          <h2 className="text-sm font-semibold text-dark-900 uppercase tracking-wider mb-4">Delivery info</h2>
          <div className="space-y-2 text-sm">
            <div className="text-dark-700 whitespace-pre-wrap">{order.shipping_address || '-'}</div>
            {order.billing_address ? (
              <div className="text-dark-500 whitespace-pre-wrap">Billing: {order.billing_address}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6">
        <h2 className="text-sm font-semibold text-dark-900 uppercase tracking-wider mb-4">Production assignment</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="label">Production identifier (email/phone)</label>
            <input
              className="input-field"
              value={productionIdentifier}
              onChange={(e) => setProductionIdentifier(e.target.value)}
              placeholder="ananth@gmail.com"
            />
            <p className="text-xs text-dark-500 mt-1">
              {order?.production_identifier
                ? `Currently assigned to: ${order.production_identifier}`
                : 'Not assigned yet'}
              {order?.production_assigned_at ? ` • Assigned: ${formatDateTime(order.production_assigned_at)}` : ''}
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={assignToProduction}
            disabled={assigningProduction}
          >
            {assigningProduction
              ? isProductionAssigned
                ? 'Transferring…'
                : 'Assigning…'
              : isProductionAssigned
                ? 'Transfer to another production'
                : 'Assign to production'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-100">
          <h2 className="text-sm font-semibold text-dark-900 uppercase tracking-wider">Order items</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-100">
            <thead className="bg-dark-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-dark-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-dark-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-dark-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 bg-white">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-dark-500">No items.</td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm font-medium text-dark-900">{item._name}</td>
                    <td className="px-6 py-4 text-sm text-dark-600 text-right">₹{Number(item._price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-dark-600 text-right">{item._qty}</td>
                    <td className="px-6 py-4 text-sm font-medium text-dark-900 text-right">₹{Number(item._lineTotal || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-dark-50 font-medium">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-dark-600">Subtotal</td>
                <td className="px-6 py-3 text-right text-dark-900">₹{Number(order.subtotal || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-dark-600">Tax</td>
                <td className="px-6 py-3 text-right text-dark-900">₹{Number(order.tax || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-dark-600">Shipping</td>
                <td className="px-6 py-3 text-right text-dark-900">₹{Number(order.shipping_cost || 0).toFixed(2)}</td>
              </tr>
              <tr className="border-t border-dark-200">
                <td colSpan={3} className="px-6 py-4 text-right text-lg font-bold text-dark-900">Total</td>
                <td className="px-6 py-4 text-right text-lg font-bold text-violet-600">₹{Number(order.total || 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
