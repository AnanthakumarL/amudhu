import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

const CheckoutPage = () => {
  const navigate = useNavigate();

  const apiBase = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const [items, setItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      setAuthUser(raw ? JSON.parse(raw) : null);
    } catch {
      setAuthUser(null);
    }
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

  const readDeliveryAddress = () => {
    try {
      const raw = localStorage.getItem("delivery_address");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeCartItems = (nextItems) => {
    localStorage.setItem("cart_items", JSON.stringify(nextItems));
    window.dispatchEvent(new Event("cart-changed"));
  };

  useEffect(() => {
    const sync = () => {
      setItems(readCartItems());
      setDeliveryAddress(readDeliveryAddress());
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("cart-changed", sync);
    window.addEventListener("address-changed", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("cart-changed", sync);
      window.removeEventListener("address-changed", sync);
    };
  }, []);

  const formatPrice = (value) => {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return `₹${numberValue.toFixed(0)}`;
    return "";
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => {
      const price = Number(it?.price) || 0;
      const qty = Number(it?.quantity) || 0;
      return sum + price * qty;
    }, 0);

    const totalItems = items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);

    return { subtotal, totalItems };
  }, [items]);

  const customerIdentifier = useMemo(() => {
    return String(authUser?.identifier || "").trim();
  }, [authUser]);

  const customerEmail = useMemo(() => {
    return customerIdentifier.includes("@") ? customerIdentifier : "";
  }, [customerIdentifier]);

  const canPlaceOrder =
    items.length > 0 &&
    !!deliveryAddress &&
    !!paymentMethod &&
    !!customerIdentifier &&
    !isPlacing;

  const buildShippingAddress = () => {
    if (!deliveryAddress) return "";
    const parts = [deliveryAddress.address, deliveryAddress.locality, deliveryAddress.pin_code]
      .map((p) => String(p || "").trim())
      .filter(Boolean);
    return parts.join(", ");
  };

  const placeOrder = async () => {
    if (!canPlaceOrder) return;
    setNotice("");
    setError("");
    setIsPlacing(true);

    try {
      const shippingAddress = buildShippingAddress();
      if (!shippingAddress) throw new Error("Missing shipping address");

      const orderItems = items
        .map((it) => {
          const quantity = Math.max(1, Number(it?.quantity) || 1);
          const price = Number(it?.price) || 0;
          return {
            product_id: String(it?.id || ""),
            product_name: String(it?.name || "Product"),
            quantity,
            price,
            subtotal: price * quantity,
          };
        })
        .filter((it) => it.product_id);

      if (orderItems.length === 0) throw new Error("Cart is empty");

      if (paymentMethod === "cod") {
        const payload = {
          customer_name: String(authUser?.name || "User"),
          customer_identifier: customerIdentifier,
          customer_email: customerEmail || null,
          customer_phone: customerEmail ? null : customerIdentifier,
          shipping_address: shippingAddress,
          billing_address: null,
          items: orderItems,
          subtotal: totals.subtotal,
          tax: 0,
          shipping_cost: 0,
          total: totals.subtotal,
          status: "pending",
          notes: `payment_method=${paymentMethod}`,
        };

        const res = await fetch(`${apiBase}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to place order (${res.status})`);
        }

        await res.json();
        writeCartItems([]);
        setNotice("Order placed successfully.");
        setTimeout(() => {
          navigate("/orders");
        }, 600);
        return;
      }

      if (!STRIPE_PUBLISHABLE_KEY) {
        throw new Error("Stripe publishable key is missing (VITE_STRIPE_PUBLISHABLE_KEY)");
      }

      const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      if (!stripe) throw new Error("Failed to initialize Stripe");

      const stripePayload = {
        customer_name: String(authUser?.name || "User"),
        customer_identifier: customerIdentifier,
        customer_email: customerEmail || null,
        customer_phone: customerEmail ? null : customerIdentifier,
        shipping_address: shippingAddress,
        billing_address: null,
        items: orderItems.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
        })),
      };

      const res = await fetch(`${apiBase}/payments/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripePayload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to start Stripe checkout (${res.status})`);
      }

      const data = await res.json();
      const sessionId = String(data?.session_id || "");
      if (!sessionId) throw new Error("Stripe session id missing from server response");

      const result = await stripe.redirectToCheckout({ sessionId });
      if (result?.error?.message) {
        throw new Error(result.error.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-6 pt-24">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
              Checkout
            </h1>
            <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
              Select delivery address and payment method.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/cart"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 transition-colors duration-150 ease-out hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(58,186,114,0.25)] focus-visible:ring-offset-2"
              style={{ fontFamily: "Outfit" }}
            >
              Back to cart
            </NavLink>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-neutral-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                    Delivery address
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                    Choose where we should deliver your order.
                  </p>
                </div>

                <NavLink
                  to="/add-address"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 transition-colors duration-150 ease-out hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(58,186,114,0.25)] focus-visible:ring-offset-2"
                  style={{ fontFamily: "Outfit" }}
                >
                  Add / change
                </NavLink>
              </div>

              {!deliveryAddress ? (
                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-700" style={{ fontFamily: "Outfit" }}>
                  No address saved yet. Click “Add / change” to add your delivery address.
                </div>
              ) : (
                <label className="mt-4 block cursor-pointer">
                  <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4 transition-colors duration-150 ease-out hover:bg-neutral-50">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked
                        readOnly
                        className="mt-1 h-4 w-4 accent-[rgba(58,186,114,1.00)]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                          Saved address
                        </p>
                        <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                          {deliveryAddress.address}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                          {deliveryAddress.locality} - {deliveryAddress.pin_code}
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              )}
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                Payment method
              </h2>
              <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                Select a payment method.
              </p>

              <div className="mt-4 space-y-3">
                <label className="block cursor-pointer">
                  <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4 transition-colors duration-150 ease-out hover:bg-neutral-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="h-4 w-4 accent-[rgba(58,186,114,1.00)]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                          Cash on Delivery
                        </p>
                        <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                          Pay when your order is delivered.
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="block cursor-pointer">
                  <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4 transition-colors duration-150 ease-out hover:bg-neutral-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_method"
                        value="upi"
                        checked={paymentMethod === "upi"}
                        onChange={() => setPaymentMethod("upi")}
                        className="h-4 w-4 accent-[rgba(58,186,114,1.00)]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                          UPI
                        </p>
                        <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                          Pay using any UPI app.
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="block cursor-pointer">
                  <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4 transition-colors duration-150 ease-out hover:bg-neutral-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_method"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className="h-4 w-4 accent-[rgba(58,186,114,1.00)]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                          Card
                        </p>
                        <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                          Debit / credit card payment.
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <aside className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
              Order summary
            </h2>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                  Items
                </span>
                <span className="text-sm font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                  {totals.totalItems}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                  Total
                </span>
                <span className="text-sm font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                  {formatPrice(totals.subtotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!canPlaceOrder}
              onClick={placeOrder}
              className={
                !canPlaceOrder
                  ? "mt-6 w-full cursor-not-allowed rounded-xl bg-neutral-200 px-4 py-3 text-sm font-medium text-neutral-500"
                  : "mt-6 w-full rounded-xl bg-[rgba(58,186,114,1.00)] px-4 py-3 text-sm font-medium text-white transition-opacity duration-150 ease-out hover:opacity-[0.96] active:opacity-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(58,186,114,0.25)] focus-visible:ring-offset-2"
              }
              style={{ fontFamily: "Outfit" }}
            >
              {isPlacing ? "Processing..." : paymentMethod === "cod" ? "Place order" : "Pay with Stripe"}
            </button>

            {!deliveryAddress ? (
              <p className="mt-3 text-xs text-neutral-500" style={{ fontFamily: "Outfit" }}>
                Add a delivery address to continue.
              </p>
            ) : null}

            {!customerIdentifier ? (
              <p className="mt-3 text-xs text-neutral-500" style={{ fontFamily: "Outfit" }}>
                Please login to place an order.
              </p>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" style={{ fontFamily: "Outfit" }}>
                {error}
              </div>
            ) : null}

            {notice ? (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" style={{ fontFamily: "Outfit" }}>
                {notice}
              </div>
            ) : null}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
