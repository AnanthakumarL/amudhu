import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight, Star, Leaf, Truck, Award, RefreshCw, ChevronRight,
} from 'lucide-react'
import { fetchRealtimeCatalog } from '../services/realtimeCatalog'
import ProductCard from '../components/ProductCard'

/* ─── Fade-up wrapper ─── */
function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const perks = [
  { icon: Leaf,      title: 'Natural Ingredients',  desc: 'No artificial colours, flavours, or preservatives. Ever.' },
  { icon: Award,     title: 'Handcrafted Daily',    desc: 'Small batches churned fresh every morning in our kitchen.' },
  { icon: Truck,     title: 'Cold-chain Delivery',  desc: 'Arrives perfectly frozen at your doorstep, guaranteed.' },
  { icon: RefreshCw, title: 'Freshness Promise',    desc: 'Not happy? We will remake your order. No questions asked.' },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadCatalog = async () => {
      try {
        const data = await fetchRealtimeCatalog()
        if (!mounted) return

        setProducts(data.products)
        setCategories(data.categories.filter(c => c.id !== 'all'))
      } catch (_err) {
        if (!mounted) return
        setProducts([])
        setCategories([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadCatalog()
    const interval = setInterval(loadCatalog, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const categoryCards = useMemo(() => {
    const styles = [
      { icon: '🍦', desc: 'Most ordered right now', bg: 'from-amber-50 to-amber-100', border: 'border-amber-200' },
      { icon: '🍓', desc: 'Trending this week', bg: 'from-rose-50 to-rose-100', border: 'border-rose-200' },
      { icon: '✨', desc: 'Freshly updated range', bg: 'from-stone-50 to-stone-100', border: 'border-stone-200' },
      { icon: '🌿', desc: 'Live collection', bg: 'from-teal-50 to-teal-100', border: 'border-teal-200' },
    ]

    return categories.slice(0, 4).map((cat, i) => ({
      id: cat.id,
      label: cat.label,
      ...styles[i % styles.length],
    }))
  }, [categories])

  const bestsellers = useMemo(() => {
    const featured = products.filter(p => p.bestseller)
    const nonFeatured = products.filter(p => !p.bestseller)
    return [...featured, ...nonFeatured].slice(0, 4)
  }, [products])

  const spotlight = bestsellers[0] || null

  const marqueeItems = useMemo(() => {
    if (!products.length) return ['Freshly crafted', 'Live menu updates', 'Quality ingredients']
    return products.slice(0, 10).map(p => p.name)
  }, [products])

  return (
    <div className="min-h-screen bg-[#F9F8F6]">

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-white">
        {/* background dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #a8a29e 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        {/* soft warm glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-50 rounded-full blur-3xl opacity-60 -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-stone-100 rounded-full blur-3xl opacity-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16
                        grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 badge bg-stone-100 text-stone-600 border border-stone-200 mb-6 text-sm"
            >
              <Leaf size={13} className="text-olive-700" /> Handcrafted in Chennai since 2018
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-stone-900 leading-[1.05] mb-6"
            >
              Every scoop<br />
              <span className="text-olive-700 italic">tells a story.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="text-stone-500 text-lg leading-relaxed mb-10 max-w-md"
            >
              Amudhu crafts small-batch ice creams using real fruits, nuts, and spices —
              with zero shortcuts. Pure bliss in every bite.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/menu" className="btn-primary flex items-center gap-2">
                Explore Menu <ArrowRight size={16} />
              </Link>
              <Link to="/about"
                className="border-2 border-stone-200 text-stone-600 px-7 py-3 rounded-full font-body
                           font-semibold text-sm tracking-wide hover:border-stone-400 hover:text-stone-900
                           hover:bg-stone-50 active:scale-95 transition-all duration-200">
                Our Story
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="mt-10 flex items-center gap-6"
            >
              <div className="flex -space-x-2">
                {[5, 9, 12, 15, 20].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/40?img=${i}`} alt=""
                    className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm" />
                ))}
              </div>
              <div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-stone-400 text-xs mt-0.5">
                  <span className="text-stone-900 font-semibold">4.9/5</span> · 1,200+ happy customers
                </p>
              </div>
            </motion.div>
          </div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative flex justify-center"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                            w-80 h-80 bg-amber-100/60 rounded-full blur-3xl" />

            <motion.img
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              src="https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=700&q=80"
              alt="Artisan ice cream"
              className="relative w-full max-w-sm lg:max-w-md rounded-3xl object-cover shadow-2xl
                         border border-stone-200"
              style={{ aspectRatio: '4/5' }}
            />

            {/* Floating badge 1 */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute top-8 -left-4 bg-white rounded-2xl shadow-xl px-4 py-2 flex items-center gap-2 border border-stone-100"
            >
              <span className="text-2xl">🥭</span>
              <div>
                <p className="text-xs font-bold text-stone-900">Mango Bliss</p>
                <p className="text-xs text-stone-400">Bestseller</p>
              </div>
            </motion.div>

            {/* Floating badge 2 */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, delay: 0.5 }}
              className="absolute bottom-12 -right-4 bg-white rounded-2xl shadow-xl px-4 py-2 border border-stone-100"
            >
              <p className="text-xs text-stone-400">Free delivery</p>
              <p className="text-sm font-bold text-stone-900">Orders over ₹499</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#F9F8F6" />
          </svg>
        </div>
      </section>

      {/* ══ SCROLLING MARQUEE ══ */}
      <section className="py-6 bg-olive-700 overflow-hidden">
        <div className="marquee-track gap-12 px-4">
          {[...Array(2)].map((_, ri) =>
            marqueeItems.map((name, i) => (
              <span key={`${ri}-${i}`} className="flex items-center gap-3 text-white whitespace-nowrap">
                <span className="text-white/40 text-xl">✦</span>
                <span className="font-body font-medium text-sm tracking-wide">{name}</span>
              </span>
            ))
          )}
        </div>
      </section>

      {/* ══ CATEGORIES ══ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-12">
          <p className="text-stone-400 font-body text-sm font-semibold uppercase tracking-widest mb-3">
            Explore by Mood
          </p>
          <h2 className="section-title">Find Your Flavour</h2>
        </FadeUp>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryCards.map((cat, i) => (
            <FadeUp key={cat.id} delay={i * 0.08}>
              <Link
                to={`/menu?category=${cat.id}`}
                className={`card p-6 border ${cat.border} bg-gradient-to-br ${cat.bg}
                            flex flex-col items-center text-center gap-3 group hover:shadow-lg`}
              >
                <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                  {cat.icon}
                </span>
                <div>
                  <p className="font-display font-bold text-stone-900 text-lg">{cat.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{cat.desc}</p>
                </div>
                <span className="text-xs text-stone-500 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Shop now <ChevronRight size={12} />
                </span>
              </Link>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══ BESTSELLERS ══ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="flex items-end justify-between mb-12 gap-4 flex-wrap">
            <div>
              <p className="text-stone-400 font-body text-sm font-semibold uppercase tracking-widest mb-3">
                Most Loved
              </p>
              <h2 className="section-title">Our Bestsellers</h2>
            </div>
            <Link to="/menu" className="btn-outline flex items-center gap-2">
              View all <ArrowRight size={15} />
            </Link>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <p className="text-stone-500">Loading live products...</p>
            ) : bestsellers.length ? (
              bestsellers.map((p, i) => (
                <FadeUp key={p.id} delay={i * 0.08}>
                  <ProductCard product={p} />
                </FadeUp>
              ))
            ) : (
              <p className="text-stone-500">No live products available at the moment.</p>
            )}
          </div>
        </div>
      </section>

      {/* ══ FEATURE BANNER ══ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <div className="rounded-3xl bg-stone-900 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            <div className="p-10 lg:p-16 flex flex-col justify-center">
              <span className="badge bg-stone-800 text-stone-300 border border-stone-700 mb-4 w-fit">
                Limited Edition
              </span>
              <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
                {spotlight?.name || 'Live Product Spotlight'} — <br />
                <span className="text-olive-400 italic">fresh from the live catalog</span>
              </h2>
              <p className="text-stone-400 text-base leading-relaxed mb-8">
                {spotlight?.tagline || 'This section updates from backend data in real time.'}
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to={spotlight ? `/product/${spotlight.id}` : '/menu'} className="btn-primary">
                  Order Now {spotlight ? `— ₹${spotlight.price}` : ''}
                </Link>
                <Link to={spotlight ? `/product/${spotlight.id}` : '/menu'}
                  className="text-stone-400 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors">
                  Learn more <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="relative min-h-[280px] lg:min-h-0">
              <img
                src={spotlight?.image || 'https://images.unsplash.com/photo-1546039907-7fa05f864c02?w=700&q=80'}
                alt="Saffron Kesar ice cream"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-transparent to-transparent lg:bg-none" />
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ══ WHY AMUDHU ══ */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-14">
            <p className="text-stone-400 font-body text-sm font-semibold uppercase tracking-widest mb-3">
              Why Choose Us
            </p>
            <h2 className="section-title">The Amudhu Promise</h2>
            <p className="section-subtitle mt-3 max-w-xl mx-auto">
              We believe great ice cream starts with great ingredients, not great marketing.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk, i) => (
              <FadeUp key={perk.title} delay={i * 0.1}>
                <div className="card p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-olive-50 flex items-center justify-center mx-auto mb-4">
                    <perk.icon size={22} className="text-olive-700" />
                  </div>
                  <h3 className="font-display font-bold text-stone-900 text-lg mb-2">{perk.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{perk.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LIVE UPDATES ══ */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-14">
            <p className="text-stone-400 font-body text-sm font-semibold uppercase tracking-widest mb-3">
              Live Catalog
            </p>
            <h2 className="section-title">Fresh Data Feed</h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 3).map((p, i) => (
              <FadeUp key={p.id} delay={i * 0.1}>
                <div className="card p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(Math.round(p.rating || 5))].map((_, si) => (
                      <Star key={si} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed mb-6 italic">
                    "{p.tagline}"
                  </p>
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-stone-100" />
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">{p.name}</p>
                      <p className="text-xs text-stone-400">{p.category}</p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeUp>
            <p className="text-stone-400 font-body text-sm font-semibold uppercase tracking-widest mb-3">
              Ordering is Simple
            </p>
            <h2 className="section-title mb-14">How It Works</h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px bg-stone-200" />

            {[
              { step: '01', title: 'Browse & Pick',    desc: 'Explore our curated menu and pick your favourite scoops.',  emoji: '🍽️' },
              { step: '02', title: 'Place Your Order',  desc: 'Checkout securely in under 2 minutes — no account needed.', emoji: '📱' },
              { step: '03', title: 'Enjoy!',            desc: 'We deliver frozen-fresh to your door. Happy scooping.',      emoji: '🎉' },
            ].map((s, i) => (
              <FadeUp key={s.step} delay={i * 0.15}>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-3xl">
                      {s.emoji}
                    </div>
                    <span className="absolute -top-1 -right-1 badge bg-olive-700 text-white text-[10px]">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-stone-900 text-xl">{s.title}</h3>
                  <p className="text-sm text-stone-500 max-w-xs leading-relaxed">{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.4} className="mt-14">
            <Link to="/menu" className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4">
              Start Ordering <ArrowRight size={18} />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ══ NEWSLETTER ══ */}
      <section className="py-20 bg-stone-900">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <FadeUp>
            <p className="text-stone-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Stay in the Loop
            </p>
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              New flavours, before anyone else
            </h2>
            <p className="text-stone-400 mb-8">
              Subscribe for seasonal drops, exclusive offers, and behind-the-scenes stories
              from our kitchen.
            </p>
            <form
              className="flex gap-3 flex-col sm:flex-row"
              onSubmit={e => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Your email address"
                className="input-field flex-1 bg-stone-800 border-stone-700 text-white placeholder-stone-500
                           focus:ring-olive-500"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
            <p className="text-stone-600 text-xs mt-4">
              No spam, ever. Unsubscribe anytime.
            </p>
          </FadeUp>
        </div>
      </section>
    </div>
  )
}
