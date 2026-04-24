import React from 'react'
import { BrowserRouter, Routes, Route, ScrollRestoration, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from './context/CartContext'

import Navbar   from './components/Navbar'
import Footer   from './components/Footer'

import Home             from './pages/Home'
import Menu             from './pages/Menu'
import ProductDetail    from './pages/ProductDetail'
import Cart             from './pages/Cart'
import Checkout         from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import About            from './pages/About'
import Contact          from './pages/Contact'

/* Scroll to top on route change */
function ScrollToTop() {
  const { pathname } = useLocation()
  React.useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Layout() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"                   element={<Home />} />
          <Route path="/menu"               element={<Menu />} />
          <Route path="/product/:id"        element={<ProductDetail />} />
          <Route path="/cart"               element={<Cart />} />
          <Route path="/checkout"           element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/about"              element={<About />} />
          <Route path="/contact"            element={<Contact />} />
          <Route path="*"                   element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen bg-parchment pt-24 flex flex-col items-center justify-center gap-4 text-center px-4">
      <span className="text-7xl">🍦</span>
      <h1 className="font-display text-5xl font-bold text-olive-900">404</h1>
      <p className="text-olive-600 text-lg">Oops! This page seems to have melted.</p>
      <a href="/" className="btn-primary mt-2">Go Home</a>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />
        <Layout />
        <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
      </CartProvider>
    </BrowserRouter>
  )
}
