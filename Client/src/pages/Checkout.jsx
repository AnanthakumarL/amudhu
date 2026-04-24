import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronRight, MapPin, CreditCard, CheckCircle2,
  Lock, ArrowLeft, QrCode, RefreshCw, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext'

const API_BASE_URL = (() => {
  const configured = import.meta.env.VITE_API_BASE_URL
  if (configured) return configured
  const protocol = window.location.protocol || 'http:'
  const hostname = window.location.hostname || 'localhost'
  return `${protocol}//${hostname}:7999/api/v1`
})()

const steps = ['Delivery', 'Payment', 'Review']
const QR_EXPIRE_SECS = 900 // 15 min

function Field({ label, id, type = 'text', placeholder, required, className = '', inputRef }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input ref={inputRef} id={id} name={id} type={type} placeholder={placeholder}
        className="input-field" required={required} />
    </div>
  )
}

function Countdown({ expiresAt }) {
  const [secs, setSecs] = useState(Math.max(0, expiresAt - Math.floor(Date.now() / 1000)))
  useEffect(() => {
    const id = setInterval(() => {
      setSecs(s => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return (
    <span className={`font-mono text-sm font-semibold ${secs < 60 ? 'text-rose-500' : 'text-stone-500'}`}>
      {m}:{s}
    </span>
  )
}

export default function Checkout() {
  const [step, setStep] = useState(0)
  const [payMethod, setPayMethod] = useState('qr') // 'qr' | 'modal'
  const [loading, setLoading] = useState(false)
  const [deliveryData, setDeliveryData] = useState(null)

  // QR state
  const [qrData, setQrData] = useState(null)   // { qr_id, qr_image_url, order, expires_at, amount }
  const [qrPaid, setQrPaid] = useState(false)
  const pollRef = useRef(null)

  const { items, subtotal, delivery, total, clearCart } = useCart()
  const navigate = useNavigate()

  // Delivery form refs
  const fnameRef  = useRef()
  const lnameRef  = useRef()
  const emailRef  = useRef()
  const phoneRef  = useRef()
  const addr1Ref  = useRef()
  const addr2Ref  = useRef()
  const cityRef   = useRef()
  const pinRef    = useRef()
  const stateRef  = useRef()

  // Clean up poller on unmount
  useEffect(() => () => clearInterval(pollRef.current), [])

  const handleDeliveryContinue = () => {
    const required = [fnameRef, lnameRef, emailRef, phoneRef, addr1Ref, cityRef, pinRef]
    for (const r of required) {
      if (!r.current?.value?.trim()) {
        r.current?.focus()
        toast.error('Please fill all required fields')
        return
      }
    }
    setDeliveryData({
      customer_name: `${fnameRef.current.value.trim()} ${lnameRef.current.value.trim()}`.trim(),
      customer_identifier: emailRef.current.value.trim() || phoneRef.current.value.trim(),
      customer_email: emailRef.current.value.trim() || null,
      customer_phone: phoneRef.current.value.trim() || null,
      shipping_address: [
        addr1Ref.current.value.trim(),
        addr2Ref.current.value.trim(),
        cityRef.current.value.trim(),
        stateRef.current.value.trim(),
        pinRef.current.value.trim(),
      ].filter(Boolean).join(', '),
    })
    setStep(1)
  }

  // ── QR Code flow ────────────────────────────────────────────────────────

  const USE_STATIC_QR = total <= 8  // static pre-created ₹8 QR from Razorpay dashboard

  const startQRPolling = (orderId, isStatic = false) => {
    clearInterval(pollRef.current)
    const endpoint = isStatic
      ? `${API_BASE_URL}/payments/static-qr-check/${orderId}`
      : `${API_BASE_URL}/payments/qr-status/${orderId}`
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(endpoint)
        if (!res.ok) return
        const data = await res.json()
        if (data.paid) {
          clearInterval(pollRef.current)
          setQrPaid(true)
          clearCart()
          toast.success('Payment received! 🎉')
          setTimeout(() => navigate(`/order-confirmation?order_id=${orderId}`), 1500)
        }
      } catch { /* ignore network blips */ }
    }, 3000)
  }

  const generateQRCode = async () => {
    setLoading(true)
    setQrData(null)
    try {
      const endpoint = USE_STATIC_QR
        ? `${API_BASE_URL}/payments/create-static-qr-order`
        : `${API_BASE_URL}/payments/create-qr-order`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...deliveryData,
          items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to generate QR code')
      }
      const data = await res.json()
      setQrData(data)
      startQRPolling(data.order.id, USE_STATIC_QR)
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // ── Razorpay Modal flow ─────────────────────────────────────────────────

  const handlePayWithRazorpay = async () => {
    if (typeof window.Razorpay === 'undefined') {
      toast.error('Razorpay failed to load. Please refresh and try again.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...deliveryData,
          items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to create order')
      }
      const data = await res.json()

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'Amudhu',
        description: 'Artisan Ice Cream Order',
        order_id: data.razorpay_order_id,
        prefill: {
          name: deliveryData.customer_name,
          email: deliveryData.customer_email || '',
          contact: deliveryData.customer_phone || '',
        },
        theme: { color: '#435729' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: data.order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            if (!verifyRes.ok) throw new Error('Verification failed')
            clearCart()
            toast.success('Payment successful!')
            navigate(`/order-confirmation?order_id=${data.order.id}`)
          } catch {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
            toast('Payment cancelled', { icon: 'ℹ️' })
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        setLoading(false)
        toast.error(`Payment failed: ${resp.error.description}`)
      })
      rzp.open()
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  // ───────────────────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 bg-[#F9F8F6] flex flex-col items-center justify-center gap-4">
        <h2 className="font-display text-2xl text-stone-900">Nothing to checkout</h2>
        <Link to="/menu" className="btn-primary">Browse Menu</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <Link to="/cart" className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-800 mb-4 transition-colors">
            <ArrowLeft size={15} /> Back to cart
          </Link>
          <h1 className="font-display text-4xl font-bold text-stone-900">Checkout</h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 cursor-pointer ${i <= step ? '' : 'opacity-40'}`}
                onClick={() => i < step && setStep(i)}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-olive-700 text-white' : 'bg-stone-200 text-stone-500'}`}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${i === step ? 'text-stone-900' : 'text-stone-400'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-green-400' : 'bg-stone-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">

            {/* Step 0 — Delivery */}
            {step === 0 && (
              <motion.div key="delivery" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                    <MapPin size={18} className="text-stone-600" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-stone-900">Delivery Details</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="First Name" id="fname" placeholder="Arjun"    required inputRef={fnameRef} />
                  <Field label="Last Name"  id="lname" placeholder="Mehta"    required inputRef={lnameRef} />
                  <Field label="Email"   id="email" type="email" placeholder="arjun@example.com" required className="sm:col-span-2" inputRef={emailRef} />
                  <Field label="Phone"   id="phone" type="tel"  placeholder="+91 98765 43210"    required className="sm:col-span-2" inputRef={phoneRef} />
                  <Field label="Address Line 1" id="addr1" placeholder="House / flat / street"   required className="sm:col-span-2" inputRef={addr1Ref} />
                  <Field label="Address Line 2" id="addr2" placeholder="Locality (optional)"              className="sm:col-span-2" inputRef={addr2Ref} />
                  <Field label="City"     id="city" placeholder="Chennai" required inputRef={cityRef} />
                  <Field label="Pin Code" id="pin"  placeholder="600 001" required inputRef={pinRef} />
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">State</label>
                    <select ref={stateRef} className="input-field">
                      <option>Tamil Nadu</option><option>Karnataka</option>
                      <option>Kerala</option><option>Maharashtra</option><option>Delhi</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleDeliveryContinue} className="btn-primary mt-6 flex items-center gap-2 ml-auto">
                  Continue to Payment <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {/* Step 1 — Payment method */}
            {step === 1 && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                    <CreditCard size={18} className="text-stone-600" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-stone-900">Payment</h2>
                </div>

                {/* Method tabs */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { id: 'qr',    label: 'UPI QR Code',      icon: <QrCode size={22} /> },
                    { id: 'modal', label: 'Card / UPI / More', icon: <CreditCard size={22} /> },
                  ].map(m => (
                    <button key={m.id} onClick={() => { setPayMethod(m.id); setQrData(null) }}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 text-sm font-medium transition-all
                        ${payMethod === m.id ? 'border-olive-700 bg-olive-50 text-stone-800' : 'border-stone-200 text-stone-400 hover:border-stone-400'}`}>
                      {m.icon}{m.label}
                    </button>
                  ))}
                </div>

                {/* QR panel */}
                {payMethod === 'qr' && (
                  <div className="flex flex-col items-center gap-4">
                    {!qrData && (
                      <div className="text-center space-y-3">
                        {USE_STATIC_QR ? (
                          <p className="text-sm text-stone-500">
                            Scan the <span className="font-semibold text-stone-800">Amudhu UPI QR</span> to pay
                            exactly <span className="font-semibold text-stone-800">₹{total}</span> via any UPI app.
                          </p>
                        ) : (
                          <p className="text-sm text-stone-500">
                            A UPI QR code will be generated for <span className="font-semibold text-stone-800">₹{total}</span>.
                            Scan with any UPI app (GPay, PhonePe, Paytm…) to pay instantly.
                          </p>
                        )}
                        <button onClick={generateQRCode} disabled={loading}
                          className="btn-primary flex items-center gap-2 mx-auto disabled:opacity-60">
                          {loading ? <RefreshCw size={16} className="animate-spin" /> : <QrCode size={16} />}
                          {loading ? 'Loading QR…' : 'Show QR Code'}
                        </button>
                      </div>
                    )}

                    {qrData && !qrPaid && (
                      <div className="flex flex-col items-center gap-3 w-full">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                          <img src={qrData.qr_image_url} alt="UPI QR Code"
                            className="w-56 h-56 object-contain" />
                        </div>
                        {!USE_STATIC_QR && qrData.expires_at && (
                          <div className="flex items-center gap-2 text-stone-500 text-sm">
                            <Clock size={14} />
                            Expires in <Countdown expiresAt={qrData.expires_at} />
                          </div>
                        )}
                        <p className="text-xs text-stone-400 text-center">
                          Waiting for payment confirmation…
                          <RefreshCw size={11} className="inline ml-1 animate-spin opacity-60" />
                        </p>
                        <p className="text-xs font-semibold text-stone-600">Pay exactly ₹{total}</p>
                        {!USE_STATIC_QR && (
                          <button onClick={generateQRCode} disabled={loading}
                            className="text-xs text-stone-400 underline hover:text-stone-600 flex items-center gap-1">
                            <RefreshCw size={11} /> Refresh QR
                          </button>
                        )}
                      </div>
                    )}

                    {qrPaid && (
                      <div className="flex flex-col items-center gap-2 py-6 text-green-600">
                        <CheckCircle2 size={48} />
                        <p className="font-semibold text-lg">Payment received!</p>
                        <p className="text-sm text-stone-400">Redirecting…</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Razorpay modal info */}
                {payMethod === 'modal' && (
                  <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 text-sm text-stone-600 flex items-start gap-3">
                    <CreditCard size={16} className="text-stone-400 mt-0.5 shrink-0" />
                    <p>Pay via Razorpay checkout — supports Cards, UPI, Net Banking &amp; Wallets. You'll be taken to a secure payment page.</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-stone-400 mt-5 mb-4">
                  <Lock size={12} /> Secured by Razorpay · 256-bit SSL
                </div>

                <div className="flex justify-between gap-3">
                  <button onClick={() => setStep(0)} className="btn-outline flex items-center gap-2">
                    <ArrowLeft size={15} /> Back
                  </button>
                  {payMethod === 'modal' && (
                    <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
                      Review Order <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Review (only for modal method) */}
            {step === 2 && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 sm:p-8">
                <h2 className="font-display font-bold text-xl text-stone-900 mb-6">Review Order</h2>
                <div className="space-y-3 mb-6">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 py-3 border-b border-stone-100 last:border-0">
                      <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="font-semibold text-stone-900 text-sm">{item.name}</p>
                        <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-stone-800">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-stone-50 rounded-2xl p-4 space-y-2 text-sm mb-6">
                  <div className="flex justify-between text-stone-500"><span>Subtotal</span><span>₹{subtotal}</span></div>
                  <div className="flex justify-between text-stone-500">
                    <span>Delivery</span><span>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 text-base pt-2 border-t border-stone-200">
                    <span>Total</span><span>₹{total}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-400 mb-6">
                  <Lock size={12} /> Your payment is secured with 256-bit SSL encryption.
                </div>
                <div className="flex justify-between gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-outline flex items-center gap-2">
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button type="button" onClick={handlePayWithRazorpay} disabled={loading}
                    className="btn-primary flex items-center gap-2 px-8 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? 'Processing…' : `Pay ₹${total} via Razorpay`}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="card p-5 sticky top-24">
            <h3 className="font-display font-bold text-stone-900 text-lg mb-4">Your Order</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-800 truncate">{item.name}</p>
                    <p className="text-xs text-stone-400">×{item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-stone-800">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-100 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-400"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between text-stone-400">
                <span>Delivery</span><span>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-900 text-base border-t border-stone-100 pt-2 mt-2">
                <span>Total</span><span className="font-display">₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
