import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const apiBase = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!productId) {
        setError("Missing product id");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${apiBase}/products/${encodeURIComponent(productId)}`);
        if (!res.ok) {
          throw new Error(`Failed to load product (${res.status})`);
        }

        const data = await res.json();
        if (!cancelled) setProduct(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load product");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase, productId]);

  const getImageSrc = (p) => {
    const url = p?.image_url;
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

  const formatPrice = (value) => {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return `₹${numberValue.toFixed(0)}`;
    return "";
  };

  const readCartItems = () => {
    try {
      const raw = localStorage.getItem("cart_items");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeCartItems = (items) => {
    localStorage.setItem("cart_items", JSON.stringify(items));
    window.dispatchEvent(new Event("cart-changed"));
  };

  const addToCart = (p, quantity = 1) => {
    if (!p?.id) return;
    const safeQty = Math.max(1, Number(quantity) || 1);
    const items = readCartItems();
    const existingIndex = items.findIndex((it) => String(it?.id) === String(p.id));

    if (existingIndex >= 0) {
      const existing = items[existingIndex] || {};
      const currentQty = Number(existing.quantity) || 0;
      items[existingIndex] = { ...existing, quantity: currentQty + safeQty };
    } else {
      items.push({
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image_url || "",
        quantity: safeQty,
      });
    }

    writeCartItems(items);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, 1);
    navigate("/cart");
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, 1);
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-6 pt-24">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
              Product Details
            </h1>
            <p className="mt-1 text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
              View complete product information.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/flavours"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700"
              style={{ fontFamily: "Outfit" }}
            >
              Back to Flavours
            </NavLink>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl bg-[rgba(58,186,114,1.00)] px-4 py-2 text-sm text-white"
              style={{ fontFamily: "Outfit" }}
            >
              Go Back
            </button>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div
              className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600"
              style={{ fontFamily: "Outfit" }}
            >
              Loading product...
            </div>
          ) : error ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
              style={{ fontFamily: "Outfit" }}
            >
              {error}
            </div>
          ) : !product ? (
            <div
              className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600"
              style={{ fontFamily: "Outfit" }}
            >
              Product not found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-neutral-50">
                  <img
                    src={getImageSrc(product)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "assets/images/frame_25.png";
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                  {product.name}
                </h2>

                {product.description ? (
                  <p className="mt-3 text-sm leading-6 text-neutral-600" style={{ fontFamily: "Outfit" }}>
                    {product.description}
                  </p>
                ) : null}

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500" style={{ fontFamily: "Outfit" }}>
                      Price
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                      {formatPrice(product.price)}
                    </p>
                    {product.compare_at_price ? (
                      <p className="mt-1 text-sm text-neutral-500" style={{ fontFamily: "Outfit" }}>
                        MRP {formatPrice(product.compare_at_price)}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={
                      product.is_active
                        ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                        : "rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
                    }
                    style={{ fontFamily: "Outfit" }}
                  >
                    {product.is_active ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition-colors duration-150 ease-out hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(58,186,114,0.25)] focus-visible:ring-offset-2"
                      style={{ fontFamily: "Outfit" }}
                    >
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="w-full rounded-xl bg-[rgba(58,186,114,1.00)] px-4 py-3 text-sm font-medium text-white transition-opacity duration-150 ease-out hover:opacity-[0.96] active:opacity-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(58,186,114,0.25)] focus-visible:ring-offset-2"
                      style={{ fontFamily: "Outfit" }}
                    >
                      Buy Now
                    </button>
                  </div>

                  {notice ? (
                    <div
                      className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                      style={{ fontFamily: "Outfit" }}
                    >
                      {notice}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  {product.sku ? (
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                      <span className="text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                        SKU
                      </span>
                      <span className="text-sm font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                        {product.sku}
                      </span>
                    </div>
                  ) : null}

                  {typeof product.inventory_quantity === "number" ? (
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                      <span className="text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                        Stock
                      </span>
                      <span className="text-sm font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                        {product.inventory_quantity}
                      </span>
                    </div>
                  ) : null}

                  {typeof product.discount_percentage === "number" && product.discount_percentage > 0 ? (
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                      <span className="text-sm text-neutral-600" style={{ fontFamily: "Outfit" }}>
                        Discount
                      </span>
                      <span className="text-sm font-medium text-neutral-800" style={{ fontFamily: "Outfit" }}>
                        {product.discount_percentage}%
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetailsPage;
