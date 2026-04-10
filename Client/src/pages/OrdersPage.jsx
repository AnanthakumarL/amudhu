import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";

const OrdersPage = () => {
  const location = useLocation();
  const apiBase = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const [authUser, setAuthUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const checkout = String(params.get("checkout") || "");
      if (checkout === "success") {
        setNotice("Payment successful. Your order has been created.");
        localStorage.setItem("cart_items", JSON.stringify([]));
        window.dispatchEvent(new Event("cart-changed"));
      } else if (checkout === "cancelled") {
        setNotice("Payment was cancelled.");
      } else {
        setNotice("");
      }
    } catch {
      // ignore
    }
  }, [location.search]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      setAuthUser(raw ? JSON.parse(raw) : null);
    } catch {
      setAuthUser(null);
    }
  }, []);

  const customerIdentifier = useMemo(() => {
    return String(authUser?.identifier || "").trim();
  }, [authUser]);

  const customerEmail = useMemo(() => {
    return customerIdentifier.includes("@") ? customerIdentifier : "";
  }, [customerIdentifier]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      if (!customerIdentifier) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        const filter = customerEmail
          ? `customer_email=${encodeURIComponent(customerEmail)}`
          : `customer_identifier=${encodeURIComponent(customerIdentifier)}`;
        const url = `${apiBase}/orders?page=1&page_size=100&${filter}`;
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to load orders (${res.status})`);
        }

        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];

        if (!cancelled) setOrders(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase, customerEmail, customerIdentifier]);

  const formatPrice = (value) => {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return `₹${numberValue.toFixed(0)}`;
    return "";
  };

  const formatDate = (value) => {
    try {
      if (!value) return "";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleString();
    } catch {
      return String(value || "");
    }
  };

  const statusBadgeClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "delivered") return "bg-green-50 text-green-700";
    if (s === "cancelled") return "bg-red-50 text-red-700";
    if (s === "shipped") return "bg-blue-50 text-blue-700";
    if (s === "processing") return "bg-yellow-50 text-yellow-700";
    return "bg-neutral-100 text-neutral-700";
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-6 pt-24">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
              Orders
            </h1>
            <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
              Your past orders
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/profile"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 transition-colors duration-150 ease-out hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(58,186,114,0.25)] focus-visible:ring-offset-2"
              style={{ fontFamily: "Outfit" }}
            >
              Back to profile
            </NavLink>
          </div>
        </div>

        <div className="mt-8">
          {notice ? (
            <div
              className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-6 text-green-700"
              style={{ fontFamily: "Outfit" }}
            >
              {notice}
            </div>
          ) : null}

          {!customerIdentifier ? (
            <div
              className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-700"
              style={{ fontFamily: "Outfit" }}
            >
              Please login to view your orders.
            </div>
          ) : loading ? (
            <div
              className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600"
              style={{ fontFamily: "Outfit" }}
            >
              Loading orders...
            </div>
          ) : error ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
              style={{ fontFamily: "Outfit" }}
            >
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div
              className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600"
              style={{ fontFamily: "Outfit" }}
            >
              No past orders found.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                        Order #{order.order_number}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                        Placed: {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(order.status)}`}
                        style={{ fontFamily: "Outfit" }}
                      >
                        {String(order.status || "pending")}
                      </span>
                      <span className="text-sm font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-neutral-50 px-4 py-3">
                      <p className="text-xs text-neutral-500" style={{ fontFamily: "Outfit" }}>
                        Delivery
                      </p>
                      <p className="mt-1 text-sm text-neutral-800" style={{ fontFamily: "Outfit" }}>
                        {order.shipping_address}
                      </p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 px-4 py-3">
                      <p className="text-xs text-neutral-500" style={{ fontFamily: "Outfit" }}>
                        Customer
                      </p>
                      <p className="mt-1 text-sm text-neutral-800" style={{ fontFamily: "Outfit" }}>
                        {order.customer_name}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                        {order.customer_email}
                      </p>
                    </div>
                  </div>

                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                        Items
                      </p>
                      <div className="mt-2 space-y-2">
                        {order.items.map((it, idx) => (
                          <div
                            key={`${order.id}-${idx}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                                {it.product_name}
                              </p>
                              <p className="mt-1 text-xs text-neutral-500" style={{ fontFamily: "Outfit" }}>
                                Qty {it.quantity} • {formatPrice(it.price)} each
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                              {formatPrice(it.subtotal)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrdersPage;
