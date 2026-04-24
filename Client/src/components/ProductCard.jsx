import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [liked, setLiked] = useState(false)

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card group overflow-hidden"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-square bg-stone-100">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.bestseller && (
            <span className="badge bg-olive-700 text-white">Bestseller</span>
          )}
          {product.new && (
            <span className="badge bg-amber-500 text-white">New</span>
          )}
          {product.originalPrice && (
            <span className="badge bg-rose-500 text-white">
              {Math.round((1 - product.price / product.originalPrice) * 100)}% off
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={() => setLiked(v => !v)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm
                     flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <Heart
            size={15}
            className={liked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}
          />
        </button>

        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0
                        transition-transform duration-300 p-3">
          <button
            onClick={() => addItem(product)}
            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
          >
            <ShoppingCart size={15} />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link
            to={`/product/${product.id}`}
            className="font-display font-semibold text-stone-900 text-base leading-tight
                       hover:text-stone-600 transition-colors line-clamp-1"
          >
            {product.name}
          </Link>
          <span className="badge bg-stone-100 text-stone-600 capitalize shrink-0">
            {product.category}
          </span>
        </div>

        <p className="text-xs text-stone-400 font-body leading-snug mb-3 line-clamp-1">
          {product.tagline}
        </p>

        <div className="flex items-center justify-between">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-stone-700">{product.rating}</span>
            <span className="text-xs text-stone-400">({product.reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            {product.originalPrice && (
              <span className="text-xs text-stone-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
            <span className="font-display font-bold text-stone-800 text-lg">
              ₹{product.price}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
