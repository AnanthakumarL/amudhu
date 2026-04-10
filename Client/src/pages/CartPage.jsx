import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";

const CartPage = () => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  const apiBase = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const readCartItems = () => {
    try {
      const raw = localStorage.getItem("cart_items");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeCartItems = (nextItems) => {
    localStorage.setItem("cart_items", JSON.stringify(nextItems));
    window.dispatchEvent(new Event("cart-changed"));
  };

  useEffect(() => {
    const sync = () => setItems(readCartItems());

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("cart-changed", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("cart-changed", sync);
    };
  }, []);

  const formatPrice = (value) => {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return `₹${numberValue.toFixed(0)}`;
    return "";
  };

  const getImageSrc = (item) => {
    const url = item?.image_url;
    if (url) {
      if (/^https?:\/\//i.test(url)) return url;
      try {
        const origin = new URL(apiBase).origin;
        return origin + (url.startsWith("/") ? url : `/${url}`);
      } catch {
        return url;
      }
    }
    return "assets/images/frame_25.png";
  };

  const updateQuantity = (id, nextQty) => {
    const safeQty = Math.max(1, Number(nextQty) || 1);
    const nextItems = items.map((it) => {
      if (String(it?.id) !== String(id)) return it;
      return { ...it, quantity: safeQty };
    });
    writeCartItems(nextItems);
  };

  const removeItem = (id) => {
    const nextItems = items.filter((it) => String(it?.id) !== String(id));
    writeCartItems(nextItems);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => {
      const price = Number(it?.price) || 0;
      const qty = Number(it?.quantity) || 0;
      return sum + price * qty;
    }, 0);

    return {
      subtotal,
      totalItems: items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0),
    };
  }, [items]);

  return (
    <div className="font-['Outfit'] min-h-screen bg-[#FCFBFA] text-[#1B4D3E] overflow-x-hidden">
      <Navbar />

      <main className="pt-24">
        <section className="relative px-6 py-20 flex flex-col items-center justify-center overflow-hidden min-h-[68vh]">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ background: "repeating-conic-gradient(from 0deg, transparent 0deg 15deg, #000 15deg 30deg)" }}
          />

          <h1 className="text-[3.5rem] md:text-[5.5rem] lg:text-[7rem] font-black uppercase tracking-tight text-[#38D4DF] leading-none mb-10 text-center z-10 drop-shadow-sm">
            Your Cart
          </h1>

          <div className="container max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center z-10 relative">
            <div className="md:pr-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#114936] shadow-sm">
                {totals.totalItems > 0 ? `${totals.totalItems} items selected` : "Cart is empty"}
              </div>
              <h2 className="mt-6 text-4xl md:text-5xl font-black uppercase text-black leading-tight">
                Review your order,
                <br />
                then head to checkout.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-gray-500">
                Your cart is presented with the same warm layered style as the home page, but keeps the buying flow simple and fast.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <NavLink
                  to="/flavours"
                  className="bg-[#0A4D3C] text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-wider shadow-xl hover:bg-[#134E39] transition"
                >
                  Continue shopping
                </NavLink>
                <button
                  type="button"
                  onClick={() => navigate("/checkout")}
                  disabled={items.length === 0}
                  className={
                    items.length === 0
                      ? "cursor-not-allowed bg-neutral-200 text-neutral-500 px-8 py-3 rounded-full font-bold uppercase text-xs tracking-wider shadow-xl"
                      : "bg-[#FDE293] text-[#1B4D3E] px-8 py-3 rounded-full font-bold uppercase text-xs tracking-wider shadow-xl hover:bg-yellow-300 transition"
                  }
                >
                  Checkout
                </button>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute -inset-8 rounded-[2.5rem] bg-[linear-gradient(135deg,rgba(56,212,223,0.14),rgba(253,226,147,0.24))] blur-2xl" />
              <div className="relative w-full max-w-[520px] rounded-[2rem] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between rounded-[1.5rem] bg-[#F8F5EE] px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#114936]">Cart summary</p>
                    <p className="mt-2 text-3xl font-black text-black">{formatPrice(totals.subtotal)}</p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#114936] text-white text-2xl">
                    🛒
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-[#FCFBFA] p-4">
                    <p className="text-gray-500">Items</p>
                    <p className="mt-1 text-lg font-bold text-black">{totals.totalItems}</p>
                  </div>
                  <div className="rounded-2xl bg-[#FCFBFA] p-4">
                    <p className="text-gray-500">Subtotal</p>
                    <p className="mt-1 text-lg font-bold text-black">{formatPrice(totals.subtotal)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-[#FDE293] py-3 overflow-hidden whitespace-nowrap border-y-2 border-[#1B4D3E]/10">
          <div className="inline-block animate-[marquee_20s_linear_infinite]">
            {[1,2,3,4,5,6,7,8,9,10].map((_, i) => (
              <span key={i} className="text-[#1B4D3E] font-black text-lg tracking-widest uppercase mx-6 flex-inline items-center gap-6">
                Premium checkout <span className="text-[#FF6B35] text-2xl mx-6">✦</span>
              </span>
            ))}
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-black mb-4 md:mb-0">
              Cart items
            </h2>
            <p className="text-xs text-gray-500 max-w-[300px] text-right">
              Review quantities, remove items, and continue to payment when ready.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {items.length === 0 ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-8 text-gray-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  No items in cart.
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row gap-5">
                      <div className="h-32 w-full md:w-32 md:h-32 flex-shrink-0 overflow-hidden rounded-2xl bg-[#F8F5EE]">
                        <img
                          src={getImageSrc(item)}
                          alt={item.name || "Product"}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "assets/images/frame_25.png";
                          }}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <p className="text-lg font-black uppercase text-black">{item.name || "Product"}</p>
                            <p className="mt-2 text-sm text-gray-500">
                              {formatPrice(item.price)} each
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded-full bg-[#FDE293] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1B4D3E] shadow-sm hover:bg-yellow-300 transition self-start"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                              Qty
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={Number(item.quantity) || 1}
                              onChange={(e) => updateQuantity(item.id, e.target.value)}
                              className="w-24 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[rgba(58,186,114,0.25)]"
                            />
                          </div>

                          <div className="rounded-full bg-[#114936] px-4 py-2 text-sm font-semibold text-white">
                            Subtotal: {formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 0))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-[#1B4D3E] p-6 text-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: "repeating-conic-gradient(from 0deg, transparent 0deg 15deg, #000 15deg 30deg)" }} />
              <div className="relative z-10">
                <h2 className="text-lg font-black uppercase">Order summary</h2>

                <div className="mt-5 space-y-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Items</span>
                    <span className="text-sm font-semibold">{totals.totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Subtotal</span>
                    <span className="text-sm font-semibold">{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="h-px w-full bg-white/15" />
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black uppercase">Total</span>
                    <span className="text-base font-black">{formatPrice(totals.subtotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={items.length === 0}
                  onClick={() => navigate("/checkout")}
                  className={
                    items.length === 0
                      ? "mt-6 w-full cursor-not-allowed rounded-full bg-neutral-200 px-4 py-3 text-sm font-bold uppercase tracking-wider text-neutral-500"
                      : "mt-6 w-full rounded-full bg-[#FDE293] px-4 py-3 text-sm font-bold uppercase tracking-wider text-[#1B4D3E] shadow-xl hover:bg-yellow-300 transition"
                  }
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1B4D3E] text-white py-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: "repeating-conic-gradient(from 0deg, transparent 0deg 15deg, #000 15deg 30deg)" }} />

          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-black uppercase text-white mb-6 leading-tight">
                Fresh picks
                <br />
                always ready
              </h2>
              <p className="text-sm text-green-100/70 mb-10 max-w-sm leading-relaxed">
                Keep browsing the full collection if you want to add more before checking out.
              </p>
              <NavLink
                to="/products"
                className="bg-[#FDE293] text-[#1B4D3E] px-8 py-3 rounded-full font-bold uppercase text-xs tracking-wider shadow-xl hover:bg-yellow-300 transition"
              >
                Browse products
              </NavLink>
            </div>

            <div className="relative flex justify-center items-center">
              <div className="bg-[#38D4DF] rounded-3xl w-[80%] h-[350px] absolute right-0 bottom-[-40px] z-0 hidden md:block"></div>

              <div className="relative z-10 flex gap-4">
                <img
                  src="https://images.unsplash.com/photo-1588195538326-c5b1e9f6e4fa?q=80&w=500&auto=format&fit=crop"
                  alt="Cart items"
                  className="w-[300px] rotate-12 drop-shadow-2xl rounded-lg"
                />

                <div className="flex flex-col gap-8 ml-4 items-start justify-center hidden lg:flex">
                  <img
                    src="https://images.unsplash.com/photo-1590165482329-37330752b04f?q=80&w=300&auto=format&fit=crop"
                    alt="Ingredients"
                    className="w-[150px] rounded-2xl shadow-xl border-4 border-white"
                  />
                  <div>
                    <h4 className="font-bold text-white text-lg">Ready to ship</h4>
                    <p className="text-xs text-green-200">Secure checkout</p>
                  </div>
                </div>
              </div>

              <button className="absolute right-10 -bottom-16 bg-[#FDE293] text-[#1B4D3E] px-8 py-3 rounded-full font-bold uppercase text-xs tracking-wider shadow-xl z-20 hover:bg-yellow-300 md:block hidden">
                Order now
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
