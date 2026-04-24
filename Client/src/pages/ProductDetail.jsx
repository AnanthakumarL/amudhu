import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star, ShoppingCart, Heart, ChevronRight,
  Plus, Minus, Share2, CheckCircle2, Leaf,
} from 'lucide-react'
import { fetchRealtimeCatalog } from '../services/realtimeCatalog'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'

export default function ProductDetail() {
  const { id } = useParams()
  const { addItem } = useCart()
  const [products, setProducts] = useState([])
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const data = await fetchRealtimeCatalog()
        if (!mounted) return

        const allProducts = data.products
        const selected = allProducts.find(p => String(p.id) === String(id)) || null

        setProducts(allProducts)
        setProduct(selected)
      } catch (_err) {
        if (!mounted) return
        setProducts([])
        setProduct(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [id])

  const [qty, setQty]             = useState(1)
  const [liked, setLiked]         = useState(false)
  const [activeImg, setActiveImg]  = useState(0)
  const [activeTab, setActiveTab]  = useState('description')

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-[#F9F8F6]">
        <h2 className="font-display text-2xl text-stone-900 mb-2">Loading product...</h2>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center bg-[#F9F8F6]">
        <span className="text-6xl mb-4">🍦</span>
        <h2 className="font-display text-2xl text-stone-900 mb-2">Flavour not found</h2>
        <p className="text-stone-500 mb-6">That scoop seems to have melted away.</p>
        <Link to="/menu" className="btn-primary">Back to Menu</Link>
      </div>
    )
  }

  const related = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-[#F9F8F6] pt-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-2 text-sm text-stone-400">
          <Link to="/" className="hover:text-stone-700 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/menu" className="hover:text-stone-700 transition-colors">Menu</Link>
          <ChevronRight size={14} />
          <span className="text-stone-700 font-medium truncate">{product.name}</span>
        </nav>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Image gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative rounded-3xl overflow-hidden aspect-square bg-stone-100 mb-4">
              <img
                src={product.gallery?.[activeImg] || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.bestseller && (
                  <span className="badge bg-olive-700 text-white text-sm">Bestseller</span>
                )}
                {product.new && (
                  <span className="badge bg-amber-500 text-white text-sm">New</span>
                )}
                {product.originalPrice && (
                  <span className="badge bg-rose-500 text-white text-sm">
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% off
                  </span>
                )}
              </div>
            </div>

            {product.gallery && product.gallery.length > 1 && (
              <div className="flex gap-3">
                {product.gallery.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImg === i ? 'border-olive-600' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-24"
          >
            <p className="text-stone-400 text-sm font-semibold uppercase tracking-widest mb-2 capitalize">
              {product.category} Collection
            </p>
            <h1 className="font-display text-4xl font-bold text-stone-900 mb-2">
              {product.name}
            </h1>
            <p className="text-stone-500 text-base mb-5 italic">{product.tagline}</p>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16}
                    className={i < Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}
                  />
                ))}
              </div>
              <span className="font-bold text-stone-800">{product.rating}</span>
              <span className="text-stone-400 text-sm">({product.reviews} reviews)</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.tags.map(tag => (
                <span key={tag} className="badge bg-stone-100 text-stone-600 text-xs">{tag}</span>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className="font-display text-4xl font-bold text-stone-800">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-stone-400 line-through">₹{product.originalPrice}</span>
              )}
              <span className="text-sm text-stone-400">/ {product.weight}</span>
            </div>

            {/* Qty */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-full px-2 py-1">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-stone-800 w-8 text-center text-lg">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-sm text-stone-500">
                Total: <span className="font-bold text-stone-800">₹{product.price * qty}</span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8 flex-wrap">
              <button
                onClick={() => addItem(product, qty)}
                className="btn-primary flex items-center gap-2 flex-1"
              >
                <ShoppingCart size={16} /> Add to Cart
              </button>
              <button
                onClick={() => setLiked(v => !v)}
                className="p-3 rounded-full border-2 border-stone-200 hover:border-stone-400 transition-colors"
              >
                <Heart size={20} className={liked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'} />
              </button>
              <button className="p-3 rounded-full border-2 border-stone-200 hover:border-stone-400 transition-colors">
                <Share2 size={20} className="text-stone-400" />
              </button>
            </div>

            {/* Perks */}
            <div className="bg-stone-50 rounded-2xl p-4 space-y-2.5 mb-6">
              {[
                'Free delivery on orders over ₹499',
                'Cold-chain packaging — arrives perfectly frozen',
                'No artificial preservatives or flavours',
              ].map(perk => (
                <div key={perk} className="flex items-start gap-2.5 text-sm text-stone-700">
                  <CheckCircle2 size={15} className="text-olive-600 mt-0.5 shrink-0" />
                  {perk}
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-stone-200 mb-6">
              <div className="flex gap-6">
                {['description', 'ingredients', 'allergens'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                      activeTab === tab
                        ? 'border-olive-700 text-stone-900'
                        : 'border-transparent text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-sm text-stone-600 leading-relaxed">
              {activeTab === 'description' && <p>{product.description}</p>}
              {activeTab === 'ingredients' && (
                <p><span className="font-semibold">Ingredients:</span> {product.ingredients}</p>
              )}
              {activeTab === 'allergens' && (
                <div className="flex items-start gap-2">
                  <Leaf size={15} className="text-stone-400 mt-0.5 shrink-0" />
                  <p><span className="font-semibold">Contains:</span> {product.allergens}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="section-title mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
