import React from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Plus, Minus, Trash2, ArrowRight, ArrowLeft,
  Truck, Tag, PackageOpen,
} from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, removeItem, updateQty, subtotal, delivery, total, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 bg-[#F9F8F6] flex flex-col items-center justify-center gap-6 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-28 h-28 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
            <PackageOpen size={44} className="text-stone-300" />
          </div>
          <h1 className="font-display text-3xl font-bold text-stone-900 mb-3">Your cart is empty</h1>
          <p className="text-stone-500 max-w-sm mx-auto mb-8">
            Looks like you haven't added any scoops yet. Explore our menu and find your favourites.
          </p>
          <Link to="/menu" className="btn-primary inline-flex items-center gap-2">
            Browse Menu <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-stone-900">Your Cart</h1>
            <p className="text-stone-400 mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-rose-500 hover:text-rose-700 font-medium transition-colors"
          >
            Clear cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence initial={false}>
              {items.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, x: -30, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="card p-5 flex gap-5"
                >
                  <Link to={`/product/${item.id}`}>
                    <img src={item.image} alt={item.name}
                      className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 mb-1">
                      <Link
                        to={`/product/${item.id}`}
                        className="font-display font-bold text-stone-900 text-lg hover:text-stone-600 truncate"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-stone-300 hover:text-rose-500 transition-colors shrink-0"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <p className="text-xs text-stone-400 mb-3">{item.weight} · {item.category}</p>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-full px-2 py-1">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-bold text-stone-800 w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-bold text-xl text-stone-800">
                          ₹{item.price * item.quantity}
                        </span>
                        {item.quantity > 1 && (
                          <p className="text-xs text-stone-400">₹{item.price} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Link
              to="/menu"
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors mt-2"
            >
              <ArrowLeft size={15} /> Continue Shopping
            </Link>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24 space-y-5">
              <h2 className="font-display font-bold text-stone-900 text-xl">Order Summary</h2>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Promo code"
                    className="input-field pl-9 py-2.5 text-sm"
                  />
                </div>
                <button className="btn-outline py-2 px-4 text-sm whitespace-nowrap">Apply</button>
              </div>

              <div className="space-y-3 text-sm pt-2">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <Truck size={13} /> Delivery
                  </span>
                  <span className={delivery === 0 ? 'text-green-600 font-semibold' : ''}>
                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                  </span>
                </div>
                {delivery > 0 && (
                  <p className="text-xs text-stone-400">Add ₹{499 - subtotal} more for free delivery</p>
                )}
              </div>

              <div className="border-t border-stone-100 pt-4 flex justify-between font-bold text-stone-900">
                <span className="text-lg">Total</span>
                <span className="font-display text-2xl">₹{total}</span>
              </div>

              <Link to="/checkout" className="btn-primary flex items-center justify-center gap-2 w-full">
                Proceed to Checkout <ArrowRight size={16} />
              </Link>

              <p className="text-xs text-center text-stone-400">Secure checkout · SSL encrypted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
