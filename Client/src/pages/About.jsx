import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Leaf, Award, Heart, Users } from 'lucide-react'

function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const milestones = [
  { year: '2018', event: 'Founded in a home kitchen in Chennai with 3 flavours.' },
  { year: '2019', event: 'First pop-up stall at Besant Nagar beach — sold out in 2 hours.' },
  { year: '2020', event: 'Launched online ordering and cold-chain delivery across Tamil Nadu.' },
  { year: '2022', event: 'Expanded to 100+ flavours; featured in The Hindu and Nat Geo Food.' },
  { year: '2024', event: 'Opened first flagship store in Anna Nagar, Chennai.' },
  { year: '2025', event: 'Reached 1,00,000 orders and zero-waste manufacturing initiative.' },
]

const team = [
  {
    name: 'Kavitha Rajan', role: 'Co-founder & Head Chef',
    bio: 'Ex-Michelin sous chef turned ice cream artisan. She obsesses over textures.',
    avatar: 'https://i.pravatar.cc/200?img=47',
  },
  {
    name: 'Muthu Krishnan', role: 'Co-founder & Flavour Scientist',
    bio: 'Food technologist who believes every ingredient has a secret. He finds them.',
    avatar: 'https://i.pravatar.cc/200?img=11',
  },
  {
    name: 'Divya Sundaram', role: 'Head of Operations',
    bio: 'Makes sure every scoop leaves on time, every time, in perfect condition.',
    avatar: 'https://i.pravatar.cc/200?img=44',
  },
]

const values = [
  { icon: Leaf,  title: 'Honest Ingredients',  desc: "We list every ingredient and hide nothing. Our customers deserve to know exactly what they're eating." },
  { icon: Award, title: 'Craft Over Scale',     desc: 'We deliberately keep batches small. Consistency and quality matter more to us than volume.' },
  { icon: Heart, title: 'Made with Intention', desc: 'Every new flavour goes through at least 12 test batches before it earns a spot on our menu.' },
  { icon: Users, title: 'Community First',      desc: 'We source locally wherever possible. 80% of our ingredients come from within Tamil Nadu.' },
]

export default function About() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] pt-16">

      {/* Hero */}
      <section className="relative bg-stone-950 py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #d6d3d1 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="badge bg-stone-800 text-stone-300 border border-stone-700 mb-4"
          >
            Our Story
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="font-display text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight"
          >
            Born from a<br />
            <span className="text-olive-400 italic">love of flavour</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-stone-400 text-lg leading-relaxed"
          >
            Amudhu — meaning <em>"nectar"</em> in Tamil — began as a kitchen experiment
            and grew into Chennai's most loved artisan ice cream brand.
          </motion.p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F9F8F6" />
          </svg>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1514517521153-1be72277b32f?w=700&q=80"
                alt="Making ice cream"
                className="rounded-3xl w-full object-cover shadow-xl"
                style={{ aspectRatio: '4/3' }}
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-5 max-w-[180px]">
                <p className="font-display font-bold text-stone-900 text-3xl">7+</p>
                <p className="text-stone-500 text-sm">years crafting happiness</p>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="text-stone-400 text-sm font-semibold uppercase tracking-widest mb-4">The Beginning</p>
            <h2 className="section-title mb-6">From a kitchen in Chennai to your doorstep</h2>
            <div className="space-y-4 text-stone-600 leading-relaxed">
              <p>
                It started with a simple question: why does most ice cream taste like it was made
                in a factory? Kavitha and Muthu — a chef and a food scientist — decided to answer
                that question by making ice cream the way it was meant to be made: slowly, carefully,
                with real ingredients.
              </p>
              <p>
                The first batch was a Mango Bliss made from Alphonso mangoes bought at T. Nagar
                market. Neighbours tasted it. Then friends. Then friends of friends. Within six
                months, Amudhu had a waitlist.
              </p>
              <p>
                Today, we make over 100 flavours in our Chennai kitchen — but the philosophy hasn't
                changed. Every scoop still starts with a question: what would make this <em>perfect</em>?
              </p>
            </div>
            <Link to="/menu" className="btn-primary inline-flex items-center gap-2 mt-8">
              Explore the Menu <ArrowRight size={15} />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-14">
            <p className="text-stone-400 text-sm font-semibold uppercase tracking-widest mb-3">What Drives Us</p>
            <h2 className="section-title">Our Values</h2>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <FadeUp key={v.title} delay={i * 0.1}>
                <div className="card p-6">
                  <div className="w-11 h-11 rounded-xl bg-olive-50 flex items-center justify-center mb-4">
                    <v.icon size={20} className="text-olive-700" />
                  </div>
                  <h3 className="font-display font-bold text-stone-900 text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{v.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-14">
            <p className="text-stone-400 text-sm font-semibold uppercase tracking-widest mb-3">The Journey</p>
            <h2 className="section-title">Our Milestones</h2>
          </FadeUp>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-200 hidden md:block" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <FadeUp key={m.year} delay={i * 0.1}>
                  <div className={`flex gap-6 md:gap-0 items-start ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                      <div className="card p-5 inline-block w-full md:w-auto max-w-xs text-left md:text-inherit">
                        <p className="badge bg-olive-700 text-white mb-2">{m.year}</p>
                        <p className="text-sm text-stone-600 leading-relaxed">{m.event}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center justify-center w-8 shrink-0 relative">
                      <div className="w-4 h-4 rounded-full bg-olive-700 border-4 border-[#F9F8F6] z-10" />
                    </div>
                    <div className="flex-1" />
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center mb-14">
            <p className="text-stone-400 text-sm font-semibold uppercase tracking-widest mb-3">The People</p>
            <h2 className="section-title">Meet the Team</h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <FadeUp key={member.name} delay={i * 0.1}>
                <div className="card p-6 text-center">
                  <img src={member.avatar} alt={member.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-stone-100" />
                  <h3 className="font-display font-bold text-stone-900 text-xl mb-1">{member.name}</h3>
                  <p className="text-stone-400 text-sm font-semibold mb-3">{member.role}</p>
                  <p className="text-sm text-stone-500 leading-relaxed">{member.bio}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-stone-900 text-center px-4">
        <FadeUp>
          <p className="text-stone-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Ready to taste the story?
          </p>
          <h2 className="font-display text-4xl font-bold text-white mb-6">
            Discover the full collection
          </h2>
          <Link to="/menu" className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4">
            Browse Menu <ArrowRight size={18} />
          </Link>
        </FadeUp>
      </section>
    </div>
  )
}
