import React from 'react'
import { Link } from 'react-router-dom'
import { IceCream2, Instagram, Facebook, Twitter, MapPin, Phone, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="bg-olive-700 p-1.5 rounded-xl">
                <IceCream2 size={20} className="text-white" />
              </span>
              <span className="font-display text-2xl font-bold text-white">amudhu</span>
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed mb-6">
              Handcrafted ice creams made with love, natural ingredients, and a deep respect
              for flavour. Every scoop tells a story.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center
                             text-stone-400 hover:bg-olive-700 hover:text-white transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4 text-lg">Explore</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/menu',                   label: 'Our Menu' },
                { to: '/menu?category=premium',  label: 'Premium Range' },
                { to: '/menu?category=seasonal', label: 'Seasonal Specials' },
                { to: '/about',                  label: 'Our Story' },
                { to: '/contact',                label: 'Contact Us' },
              ].map(l => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-stone-400 hover:text-stone-100 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4 text-lg">Help</h4>
            <ul className="space-y-2.5">
              {[
                'FAQ',
                'Delivery Information',
                'Returns & Refunds',
                'Track Your Order',
                'Allergen Info',
                'Privacy Policy',
              ].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-stone-400 hover:text-stone-100 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4 text-lg">Find Us</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-stone-400">
                <MapPin size={16} className="text-olive-500 mt-0.5 shrink-0" />
                <span>12, Anna Nagar, Chennai – 600 040, Tamil Nadu</span>
              </li>
              <li className="flex gap-3 text-sm text-stone-400">
                <Phone size={16} className="text-olive-500 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex gap-3 text-sm text-stone-400">
                <Mail size={16} className="text-olive-500 shrink-0" />
                <span>hello@amudhu.in</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-stone-900 rounded-2xl">
              <p className="text-xs text-stone-400 mb-2 font-semibold uppercase tracking-wider">
                Open Hours
              </p>
              <p className="text-sm text-stone-200">Mon – Fri: 10am – 10pm</p>
              <p className="text-sm text-stone-200">Sat – Sun: 9am – 11pm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row
                        items-center justify-between gap-2 text-xs text-stone-500">
          <p>&copy; {new Date().getFullYear()} Amudhu Ice Creams Pvt. Ltd. All rights reserved.</p>
          <p>Made with love in Chennai, India</p>
        </div>
      </div>
    </footer>
  )
}
