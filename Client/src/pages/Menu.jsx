import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X, Star, Sparkles, IceCream2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchRealtimeCatalog } from '../services/realtimeCatalog'
import ProductCard from '../components/ProductCard'

const sortOptions = [
  { value: 'popular',    label: 'Most Popular' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'newest',     label: 'Newest First' },
]

const heroImages = [
  'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80',
  'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&q=80',
  'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
  'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&q=80',
]

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery]   = useState('')
  const [sort, setSort]     = useState('popular')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([{ id: 'all', label: 'All' }])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const activeCategory = searchParams.get('category') || 'all'

  useEffect(() => {
    let mounted = true

    const loadCatalog = async () => {
      try {
        const data = await fetchRealtimeCatalog({
          search: query,
          categoryId: activeCategory,
        })
        if (!mounted) return
        setProducts(data.products)
        setCategories(data.categories)
        setError('')
      } catch (_err) {
        if (!mounted) return
        setError('Unable to load live menu right now.')
        setProducts([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadCatalog()
    const interval = setInterval(loadCatalog, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [query, activeCategory])

  const setCategory = (cat) => {
    if (cat === 'all') setSearchParams({})
    else setSearchParams({ category: cat })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = useMemo(() => {
    let list = [...products]
    switch (sort) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price);                            break
      case 'price-desc': list.sort((a, b) => b.price - a.price);                            break
      case 'rating':     list.sort((a, b) => b.rating - a.rating);                          break
      case 'newest':     list.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0));           break
      default:           list.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0))
    }
    return list
  }, [products, sort])

  return (
    <div className="min-h-screen bg-[#F9F8F6]">

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden bg-stone-950 pt-16 min-h-[560px] flex items-center">

        {/* Animated gradient orbs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] rounded-full bg-olive-700/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[-60px] right-[-60px] w-[380px] h-[380px] rounded-full bg-amber-500/15 blur-3xl"
        />

        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* ── Left: Text ── */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-olive-700/20 border border-olive-600/30
                           text-olive-400 text-xs font-semibold uppercase tracking-widest px-4 py-2
                           rounded-full mb-8"
              >
                <Sparkles size={12} />
                Handcrafted daily in Chennai
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.04] mb-6"
              >
                <span className="text-white">Pick your</span>
                <br />
                <span className="text-olive-400 italic">perfect scoop.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                className="text-stone-400 text-lg leading-relaxed max-w-md mb-10"
              >
                From classic scoops to exotic specials — every flavour is made fresh with
                real ingredients, zero shortcuts.
              </motion.p>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                className="flex items-center gap-8 flex-wrap"
              >
                {[
                  { value: products.length || '20+', label: 'Flavours' },
                  { value: '7',  label: 'Categories' },
                  { value: '4.9', label: 'Avg Rating' },
                ].map(s => (
                  <div key={s.label}>
                    <p className="font-display text-3xl font-bold text-white">{s.value}</p>
                    <p className="text-stone-500 text-xs font-medium uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* Star row */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                className="mt-8 flex items-center gap-3"
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-stone-500 text-sm">
                  <span className="text-stone-300 font-semibold">1,200+</span> happy customers
                </p>
              </motion.div>
            </div>

            {/* ── Right: Image collage ── */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.9 }}
              className="relative h-[400px] lg:h-[460px] hidden sm:block"
            >
              {/* Large main image */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-0 right-0 w-[58%] h-[72%] rounded-3xl overflow-hidden
                           shadow-2xl border border-white/10"
              >
                <img src={heroImages[0]} alt="Vanilla ice cream"
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </motion.div>

              {/* Second image — left-middle */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute top-[18%] left-0 w-[46%] h-[58%] rounded-3xl overflow-hidden
                           shadow-xl border border-white/10"
              >
                <img src={heroImages[2]} alt="Chocolate ice cream"
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </motion.div>

              {/* Third image — bottom-right */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute bottom-0 right-[6%] w-[38%] h-[34%] rounded-2xl overflow-hidden
                           shadow-xl border border-white/10"
              >
                <img src={heroImages[3]} alt="Pista ice cream"
                  className="w-full h-full object-cover" />
              </motion.div>

              {/* Floating tag — top-left */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="absolute top-2 left-[10%] bg-white rounded-2xl shadow-2xl px-4 py-2.5
                           flex items-center gap-2.5 border border-stone-100"
              >
                <div className="w-8 h-8 rounded-xl bg-olive-50 flex items-center justify-center">
                  <IceCream2 size={16} className="text-olive-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">Fresh Today</p>
                  <p className="text-[10px] text-stone-400">Churned this morning</p>
                </div>
              </motion.div>

              {/* Floating price tag — bottom-left */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                className="absolute bottom-[8%] left-[2%] bg-olive-700 rounded-2xl shadow-xl px-4 py-2.5"
              >
                <p className="text-[10px] text-olive-200 font-medium">Starting from</p>
                <p className="text-white font-display font-bold text-lg leading-none">₹20</p>
              </motion.div>

              {/* Floating rating tag — right */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                className="absolute top-[44%] -right-2 bg-stone-900 border border-stone-700
                           rounded-2xl shadow-xl px-3.5 py-2.5"
              >
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white text-xs font-bold">4.9 / 5</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,35 C480,70 960,0 1440,35 L1440,70 L0,70 Z" fill="#F9F8F6" />
          </svg>
        </div>
      </section>

      {/* ══ CONTENT ══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search flavours, tags…"
              className="input-field pl-10 pr-10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="input-field w-auto text-sm py-2"
          >
            {sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium font-body transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-olive-700 text-white shadow-md'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}

        <p className="text-sm text-stone-400 mb-6">
          Showing <span className="font-semibold text-stone-800">{filtered.length}</span> flavour{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'all' && categories.find(c => c.id === activeCategory) && (
            <> in <span className="font-semibold text-stone-800">{categories.find(c => c.id === activeCategory).label}</span></>
          )}
        </p>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-24"
            >
              <p className="font-display text-2xl text-stone-800 mt-4 mb-2">Loading live menu...</p>
              <p className="text-stone-400 text-sm">Fetching the latest products.</p>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-24"
            >
              <span className="text-6xl">🍦</span>
              <p className="font-display text-2xl text-stone-800 mt-4 mb-2">No flavours found</p>
              <p className="text-stone-400 text-sm mb-6">Try a different search or category.</p>
              <button onClick={() => { setQuery(''); setCategory('all') }} className="btn-outline">
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`${activeCategory}-${sort}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
