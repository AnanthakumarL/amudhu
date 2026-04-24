import React from 'react'
import { Link } from 'react-router-dom'
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight, PackageOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'

export default function CartSidebar() {
  const { items, removeItem, updateQty, subtotal, delivery, total, sidebarOpen, setSidebarOpen } = useCart()

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-50
                       flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-stone-700" />
                <h2 className="font-display font-bold text-stone-900 text-xl">Your Cart</h2>
                {items.length > 0 && (
                  <span className="badge bg-olive-700 text-white">{items.length}</span>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-stone-50 text-stone-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-stone-50 flex items-center justify-center">
                    <PackageOpen size={32} className="text-stone-300" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-stone-800 text-lg mb-1">
                      Your cart is empty
                    </p>
                    <p className="text-sm text-stone-500">
                      Add some delicious scoops to get started.
                    </p>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="btn-outline mt-2"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-100"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 text-sm leading-tight truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">{item.weight}</p>
                        <div className="flex items-center justify-between mt-2">
                          {/* Qty controls */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-full border border-stone-200 flex items-center
                                         justify-center hover:bg-stone-100 transition-colors"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-sm font-bold text-stone-800 w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-full border border-stone-200 flex items-center
                                         justify-center hover:bg-stone-100 transition-colors"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800">
                              ₹{item.price * item.quantity}
                            </span>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-stone-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Summary & checkout */}
            {items.length > 0 && (
              <div className="border-t border-stone-100 p-5 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Delivery</span>
                    <span className={delivery === 0 ? 'text-green-600 font-semibold' : ''}>
                      {delivery === 0 ? 'FREE' : `₹${delivery}`}
                    </span>
                  </div>
                  {delivery > 0 && (
                    <p className="text-xs text-stone-400">
                      Add ₹{499 - subtotal} more for free delivery
                    </p>
                  )}
                  <div className="flex justify-between font-bold text-stone-900 text-base pt-2 border-t border-stone-100">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  onClick={() => setSidebarOpen(false)}
                  className="btn-primary flex items-center justify-center gap-2 w-full"
                >
                  Checkout
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setSidebarOpen(false)}
                  className="btn-ghost flex items-center justify-center w-full text-sm"
                >
                  View full cart
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
