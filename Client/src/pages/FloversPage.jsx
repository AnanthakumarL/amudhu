import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";

const FloversPage = () => {
  const navigate = useNavigate();
  const apiBase = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const url = new URL(`${apiBase}/products`);
        url.searchParams.set("page", "1");
        url.searchParams.set("page_size", "100");
        url.searchParams.set("is_active", "true");

        const res = await fetch(url.toString());
        if (!res.ok) {
          throw new Error(`Failed to load products (${res.status})`);
        }

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) setProducts(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const formatPrice = (value) => {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return `₹${numberValue.toFixed(0)}`;
    return "";
  };

  const getImageSrc = (product) => {
    const url = product?.image_url;
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

  const openProductDetails = (productId) => {
    if (!productId) return;
    navigate(`/product/${encodeURIComponent(String(productId))}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-6 pt-24">
        <div className="rounded-[2rem] bg-[linear-gradient(90.0deg,rgba(237,255,245,1.00)_0.0%,rgba(254,255,239,1.00)_100.0%)] px-6 py-10 md:px-12">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-3xl font-semibold text-neutral-800 md:text-4xl" style={{ fontFamily: "Outfit" }}>
                Discover Our Signature
                <br />
                <span className="bg-[linear-gradient(90.0deg,rgba(58,186,114,1.00)_0.0%,rgba(201,216,86,1.00)_100.0%)] bg-clip-text text-transparent">
                  Ice Cream Flavours
                </span>
              </h1>
              <p className="mt-4 text-lg text-neutral-600" style={{ fontFamily: "Outfit" }}>
                Carefully developed recipes delivering consistent taste, texture, and quality at
                scale.
              </p>
            </div>

            <div className="flex justify-center md:justify-end">
              <img
                src="assets/images/deliciousicecreamflavoursarrangement_1.png"
                alt="Ice cream"
                className="w-full max-w-md rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>

        <section className="mt-12">
          <div>
            <p className="text-sm font-medium text-[rgba(212,64,60,1.00)]" style={{ fontFamily: "Outfit" }}>
              Catering Orders
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
              Explore Our Flavours
            </h2>
            <p className="mt-2 text-neutral-600" style={{ fontFamily: "Outfit" }}>
              Find the perfect flavour for every occasion and every menu.
            </p>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600" style={{ fontFamily: "Outfit" }}>
                Loading products...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700" style={{ fontFamily: "Outfit" }}>
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-600" style={{ fontFamily: "Outfit" }}>
                No products found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-3 cursor-pointer"
                    onClick={() => openProductDetails(product.id)}
                  >
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

                    <div className="mt-4">
                      <h3 className="text-base font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                        {product.name}
                      </h3>
                      {product.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-600" style={{ fontFamily: "Outfit" }}>
                          {product.description}
                        </p>
                      ) : null}

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-base font-semibold text-neutral-800" style={{ fontFamily: "Outfit" }}>
                          {formatPrice(product.price)}
                        </span>
                        <span
                          className={
                            product.is_active
                              ? "rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700"
                              : "rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600"
                          }
                          style={{ fontFamily: "Outfit" }}
                        >
                          {product.is_active ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FloversPage;
