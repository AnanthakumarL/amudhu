import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Package, Truck, MapPin, ArrowRight } from 'lucide-react'

const steps = [
  { icon: CheckCircle2, label: 'Order Confirmed', time: 'Just now',           done: true },
  { icon: Package,      label: 'Preparing',       time: 'Est. 30 mins',       done: false },
  { icon: Truck,        label: 'Out for Delivery', time: 'Est. 60–90 mins',   done: false },
  { icon: MapPin,       label: 'Delivered',        time: 'Estimated today',   done: false },
]

export default function OrderConfirmation() {
  const [orderId] = useState(() =>
    `AMD${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`
  )

  return (
    <div className="min-h-screen bg-parchment pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto text-center">
        {/* Confetti circles */}
        <div className="relative flex justify-center mb-8">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0.8],
                opacity: [1, 1, 0],
                x: Math.cos((i / 8) * Math.PI * 2) * 80,
                y: Math.sin((i / 8) * Math.PI * 2) * 80,
              }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: ['#718d3e', '#C5A028', '#e07b7b', '#6ab9c9', '#b57bce'][i % 5],
              }}
            />
          ))}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
          >
            <CheckCircle2 size={48} className="text-green-500" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-olive-600 text-sm font-semibold uppercase tracking-widest mb-2">
            Order Placed!
          </p>
          <h1 className="font-display text-4xl font-bold text-olive-900 mb-3">
            Woohoo! It's on its way 🎉
          </h1>
          <p className="text-olive-600 leading-relaxed mb-2">
            Your artisan scoops are being prepared with love. You'll receive an SMS update when they're out for delivery.
          </p>
          <p className="text-olive-400 text-sm mb-8">
            Order ID: <span className="font-bold text-olive-700">#{orderId}</span>
          </p>
        </motion.div>

        {/* Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6 mb-8 text-left"
        >
          <h2 className="font-display font-bold text-olive-900 text-lg mb-5">Order Tracker</h2>
          <div className="space-y-5">
            {steps.map((s, i) => (
              <div key={s.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    i === 0 ? 'bg-green-100 text-green-600' : 'bg-olive-100 text-olive-400'
                  }`}>
                    <s.icon size={17} />
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-px flex-1 mt-1 ${i === 0 ? 'bg-green-300' : 'bg-olive-200'}`}
                      style={{ minHeight: '20px' }} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`font-semibold text-sm ${i === 0 ? 'text-green-700' : 'text-olive-500'}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-olive-400">{s.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-olive-50 rounded-2xl p-5 mb-8 text-sm text-olive-700 text-left"
        >
          <p className="font-semibold mb-1">Pro tip: Keep your freezer ready! 🧊</p>
          <p className="text-olive-500">
            Transfer your scoops to the freezer as soon as delivery arrives to keep them at
            their best. Optimal serving temperature is -12°C.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link to="/menu" className="btn-primary flex items-center gap-2 justify-center">
            Shop More <ArrowRight size={15} />
          </Link>
          <Link to="/" className="btn-outline">Back to Home</Link>
        </motion.div>
      </div>
    </div>
  )
}
