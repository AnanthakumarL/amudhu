import { useState, useEffect, useRef } from 'react';
import { ordersAPI, productsAPI } from '../services/api';
import { Package, ShoppingCart, TrendingUp, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchDashboardData();

    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const safeToNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  };

  const fetchDashboardData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [orderStats, products, recentOrdersRes] = await Promise.all([
        ordersAPI.statistics(),
        productsAPI.list({ page: 1, page_size: 1 }),
        ordersAPI.list({ page: 1, page_size: 5 }),
      ]);

      setStats({
        totalOrders: safeToNumber(orderStats.data.total_orders),
        totalRevenue: safeToNumber(orderStats.data.total_revenue),
        totalProducts: safeToNumber(products.data.total),
      });

      setRecentOrders(recentOrdersRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${(stats.totalRevenue || 0).toFixed(2)}`,
      icon: IndianRupee,
      color: 'bg-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-violet-500',
      bg: 'bg-violet-50',
      text: 'text-violet-700'
    },
    {
      title: 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700'
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-dark-900">Dashboard Overview</h1>
        <p className="text-dark-500 mt-2">Welcome back! Here's what's happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-dark-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-dark-500">{stat.title}</p>
                <p className="text-2xl font-bold text-dark-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bg} ${stat.text} p-3 rounded-xl`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-dark-400">
              <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" />
              <span className="text-emerald-500 font-medium mr-1">+12%</span>
              <span>from last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-dark-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-dark-900">Recent Activity</h2>
            <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-sm text-dark-500">No recent orders yet.</div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id || order.order_number}
                  className="flex items-center gap-4 p-3 hover:bg-dark-50 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                    <ShoppingCart size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-900 truncate">
                      New order #{order.order_number || '—'}
                    </p>
                    <p className="text-xs text-dark-500 truncate">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-dark-900">₹{safeToNumber(order.total).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-violet-900 p-8 rounded-2xl shadow-lg relative overflow-hidden text-white">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Grow your business</h2>
            <p className="text-violet-200 mb-6 max-w-sm">
              Check out our new marketing tools to help you reach more customers and increase sales.
            </p>
            <button className="px-5 py-2.5 bg-white text-violet-900 rounded-lg font-medium hover:bg-violet-50 transition-colors">
              Explore Tools
            </button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
            <TrendingUp size={300} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
